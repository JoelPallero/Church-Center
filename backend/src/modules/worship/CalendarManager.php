<?php
require_once __DIR__ . '/../config/Database.php';

class CalendarManager
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create a new base meeting and its recurrence pattern if applicable.
     */
    public function createMeeting($data)
    {
        try {
            $this->db->beginTransaction();

            $sql = "INSERT INTO meetings (church_id, title, description, meeting_type, status, location, created_by) 
                    VALUES (:cid, :title, :desc, :type, :status, :loc, :uid)";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':cid' => $data['church_id'],
                ':title' => $data['title'],
                ':desc' => $data['description'] ?? null,
                ':type' => $data['meeting_type'] ?? 'special',
                ':status' => $data['status'] ?? 'scheduled',
                ':loc' => $data['location'] ?? null,
                ':uid' => $data['created_by']
            ]);

            $meetingId = $this->db->lastInsertId();

            if (($data['meeting_type'] ?? 'special') === 'recurrent' && isset($data['recurrence'])) {
                $this->createRecurrencePattern($meetingId, $data['recurrence']);
            }

            $this->db->commit();
            require_once __DIR__ . '/ActivityManager.php';
            (new ActivityManager())->log($data['church_id'], $data['created_by'], 'meeting.create', 'meetings', $meetingId, null, ['title' => $data['title']]);
            return $meetingId;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Failed to create meeting: " . $e->getMessage());
            return false;
        }
    }

    private function createRecurrencePattern($meetingId, $recurrence)
    {
        $sql = "INSERT INTO meeting_recurring_patterns (meeting_id, day_of_week, start_time, end_time, timezone, repeat_until) 
                VALUES (:mid, :dow, :start, :end, :tz, :until)";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':mid' => $meetingId,
            ':dow' => $recurrence['day_of_week'],
            ':start' => $recurrence['start_time'],
            ':end' => $recurrence['end_time'],
            ':tz' => $recurrence['timezone'] ?? 'UTC',
            ':until' => $recurrence['repeat_until'] ?? null
        ]);
    }

    /**
     * Synchronize/Generate instances for a specific date range.
     * This follows the "Lazy Sync" strategy.
     */
    public function syncInstances($churchId, $startDate, $endDate)
    {
        // 1. Get all active recurrence patterns for this church
        $sql = "SELECT p.*, m.title 
                FROM meeting_recurring_patterns p
                JOIN meetings m ON p.meeting_id = m.id
                WHERE m.church_id = :cid AND p.active = 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':cid' => $churchId]);
        $patterns = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $start = new DateTime($startDate);
        $end = new DateTime($endDate);

        foreach ($patterns as $pattern) {
            $current = clone $start;
            while ($current <= $end) {
                // Check if the current day matches the pattern's day of week
                if ((int) $current->format('w') === (int) $pattern['day_of_week']) {
                    $instanceDate = $current->format('Y-m-d');

                    // Check if instance already exists
                    $checkSql = "SELECT id FROM meeting_instances WHERE meeting_id = :mid AND instance_date = :idate";
                    $checkStmt = $this->db->prepare($checkSql);
                    $checkStmt->execute([':mid' => $pattern['meeting_id'], ':idate' => $instanceDate]);

                    if (!$checkStmt->fetch()) {
                        // Create instance
                        $this->createInstanceFromPattern($instanceDate, $pattern, $churchId);
                    }
                }
                $current->modify('+1 day');
            }
        }
    }

    private function createInstanceFromPattern($date, $pattern, $churchId)
    {
        $startUtc = new DateTime($date . ' ' . $pattern['start_time'], new DateTimeZone($pattern['timezone']));
        $endUtc = new DateTime($date . ' ' . $pattern['end_time'], new DateTimeZone($pattern['timezone']));

        $startUtc->setTimezone(new DateTimeZone('UTC'));
        $endUtc->setTimezone(new DateTimeZone('UTC'));

        $sql = "INSERT INTO meeting_instances (church_id, meeting_id, instance_date, start_datetime_utc, end_datetime_utc) 
                VALUES (:cid, :mid, :idate, :start, :end)";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':cid' => $churchId,
            ':mid' => $pattern['meeting_id'],
            ':idate' => $date,
            ':start' => $startUtc->format('Y-m-d H:i:s'),
            ':end' => $endUtc->format('Y-m-d H:i:s')
        ]);
    }

    public function getInstances($churchId, $startDate, $endDate)
    {
        // Sync first to ensure we have the data
        $this->syncInstances($churchId, $startDate, $endDate);

        $sql = "SELECT i.*, m.title, m.meeting_type, m.location,
                       (SELECT COUNT(*) FROM meeting_team_assignments ta WHERE ta.meeting_instance_id = i.id) as team_count,
                       (SELECT COUNT(*) FROM meeting_setlists ms WHERE ms.meeting_instance_id = i.id) as setlist_count
                FROM meeting_instances i
                JOIN meetings m ON i.meeting_id = m.id
                WHERE i.church_id = :cid AND i.instance_date BETWEEN :start AND :end
                ORDER BY i.instance_date ASC, i.start_datetime_utc ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':cid' => $churchId,
            ':start' => $startDate,
            ':end' => $endDate
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function assignTeamMember($data)
    {
        $sql = "INSERT INTO meeting_team_assignments (church_id, meeting_instance_id, member_id, role, instrument_id, is_replacement, status) 
                VALUES (:cid, :miid, :mid, :role, :inst, :is_rep, :status)";

        $stmt = $this->db->prepare($sql);
        $success = $stmt->execute([
            ':cid' => $data['church_id'],
            ':miid' => $data['meeting_instance_id'],
            ':mid' => $data['member_id'],
            ':role' => $data['role'] ?? null,
            ':inst' => $data['instrument_id'] ?? null,
            ':is_rep' => $data['is_replacement'] ?? 0,
            ':status' => 'assigned'
        ]);

        if ($success) {
            // Notify Member
            require_once __DIR__ . '/NotificationManager.php';
            // Get meeting title
            $stmtTitle = $this->db->prepare("SELECT m.title, i.instance_date FROM meeting_instances i JOIN meetings m ON i.meeting_id = m.id WHERE i.id = ?");
            $stmtTitle->execute([$data['meeting_instance_id']]);
            $info = $stmtTitle->fetch();
            $title = $info['title'] ?? 'una reunión';
            $date = $info['instance_date'] ?? '';

            (new NotificationManager())->create(
                $data['member_id'],
                'team_assignment',
                "Has sido asignado a la reunión: $title el $date.",
                "/reunions?id=" . $data['meeting_instance_id']
            );
        }

        return $success;
    }

    public function assignSetlist($data)
    {
        $sql = "INSERT INTO meeting_setlists (church_id, meeting_instance_id, setlist_id, assigned_by) 
                VALUES (:cid, :miid, :sid, :uid)";

        $stmt = $this->db->prepare($sql);
        $success = $stmt->execute([
            ':cid' => $data['church_id'],
            ':miid' => $data['meeting_instance_id'],
            ':sid' => $data['setlist_id'],
            ':uid' => $data['assigned_by']
        ]);
        if ($success) {
            require_once __DIR__ . '/ActivityManager.php';
            (new ActivityManager())->log($data['church_id'], $data['assigned_by'], 'playlist.create', 'playlists', $data['setlist_id'], null, ['meeting_instance_id' => $data['meeting_instance_id']]);

            // Notify all team members in this instance
            require_once __DIR__ . '/NotificationManager.php';
            $notif = new NotificationManager();

            $stmtTeam = $this->db->prepare("SELECT member_id FROM meeting_team_assignments WHERE meeting_instance_id = ?");
            $stmtTeam->execute([$data['meeting_instance_id']]);
            $team = $stmtTeam->fetchAll(PDO::FETCH_COLUMN);

            // Get meeting title
            $stmtTitle = $this->db->prepare("SELECT m.title FROM meeting_instances i JOIN meetings m ON i.meeting_id = m.id WHERE i.id = ?");
            $stmtTitle->execute([$data['meeting_instance_id']]);
            $title = $stmtTitle->fetchColumn();

            foreach ($team as $mid) {
                $notif->create($mid, 'setlist_published', "Se ha publicado el listado de canciones para la reunión: $title.", "/reunions?id=" . $data['meeting_instance_id']);
            }
        }
        return $success;
    }
    public function getInstanceDetails($instanceId)
    {
        // 1. Base Instance & Meeting Info
        $sql = "SELECT i.*, m.title, m.description, m.meeting_type, m.location
                FROM meeting_instances i
                JOIN meetings m ON i.meeting_id = m.id
                WHERE i.id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $instanceId]);
        $instance = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$instance)
            return null;

        // 2. Setlists
        $sqlSetlists = "SELECT s.*, p.name as playlist_name 
                        FROM meeting_setlists s
                        JOIN playlists p ON s.setlist_id = p.id
                        WHERE s.meeting_instance_id = :id";
        $stmtSetlists = $this->db->prepare($sqlSetlists);
        $stmtSetlists->execute([':id' => $instanceId]);
        $instance['setlists'] = $stmtSetlists->fetchAll(PDO::FETCH_ASSOC);

        // 3. Team Assignments
        $sqlTeam = "SELECT ta.*, m.name as member_name, i.name as instrument_name
                    FROM meeting_team_assignments ta
                    JOIN member m ON ta.member_id = m.id
                    LEFT JOIN instruments i ON ta.instrument_id = i.id
                    WHERE ta.meeting_instance_id = :id";
        $stmtTeam = $this->db->prepare($sqlTeam);
        $stmtTeam->execute([':id' => $instanceId]);
        $instance['team'] = $stmtTeam->fetchAll(PDO::FETCH_ASSOC);

        return $instance;
    }

    public function getPlaylists($churchId)
    {
        $sql = "SELECT id, name, created_at FROM playlists WHERE church_id = :cid ORDER BY created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':cid' => $churchId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getMembers($churchId)
    {
        // Simple list for assignments
        $sql = "SELECT m.id, m.name, r.name as role_name 
                FROM member m
                LEFT JOIN roles r ON m.role_id = r.id
                WHERE m.church_id = :cid AND m.status_id = 1 AND r.name != 'master'
                ORDER BY m.name ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':cid' => $churchId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getInstruments()
    {
        $sql = "SELECT id, name FROM instruments ORDER BY name ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
