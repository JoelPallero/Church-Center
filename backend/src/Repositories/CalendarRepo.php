<?php

namespace App\Repositories;

use App\Database;
use PDO;

class CalendarRepo
{
    public static function getMeetingsByChurch($churchId = null, $start = null, $end = null)
    {
        $db = Database::getInstance();

        $sql = "SELECT m.*, c.name as calendar_name 
                FROM meetings m
                LEFT JOIN calendars c ON m.calendar_id = c.id";

        $params = [];
        $where = [];

        if ($churchId) {
            $where[] = "c.church_id = ?";
            $params[] = (int) $churchId;
        }

        if ($start) {
            $where[] = "(m.start_at >= ? OR m.meeting_type = 'recurrent')";
            $params[] = $start;
        }
        if ($end) {
            $where[] = "(m.start_at <= ? OR m.meeting_type = 'recurrent')";
            $params[] = $end;
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }

        $sql .= " ORDER BY m.start_at DESC, m.id DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Map fields for frontend compatibility
        foreach ($results as &$meeting) {
            // ISO8601 formatting for FullCalendar (YYYY-MM-DDTHH:MM:SS)
            // Use a more robust check for valid datetime strings
            $hasStartAt = !empty($meeting['start_at']) && $meeting['start_at'] !== '0000-00-00 00:00:00' && $meeting['start_at'] !== '0000-00-00';

            if ($hasStartAt && $meeting['meeting_type'] !== 'recurrent') {
                try {
                    $dt = new \DateTime($meeting['start_at']);
                    $meeting['instance_date'] = $dt->format('Y-m-d');
                    $meeting['start_datetime_utc'] = $dt->format('Y-m-d\TH:i:s');
                } catch (\Exception $e) {
                    $meeting['instance_date'] = null;
                    $meeting['start_datetime_utc'] = null;
                }
            } else {
                $meeting['instance_date'] = null;
                // For recurring meetings, we still keep the start_at in start_datetime_utc 
                // but instance_date is what the list view uses for the icon.
                if ($hasStartAt) {
                    try {
                        $dt = new \DateTime($meeting['start_at']);
                        $meeting['start_datetime_utc'] = $dt->format('Y-m-d\TH:i:s');
                    } catch (\Exception $e) {
                        $meeting['start_datetime_utc'] = null;
                    }
                } else {
                    $meeting['start_datetime_utc'] = null;
                }
            }

            if ($meeting['end_at']) {
                $dtEnd = new \DateTime($meeting['end_at']);
                $meeting['end_datetime_utc'] = $dtEnd->format('Y-m-d\TH:i:s');
            } else {
                $meeting['end_datetime_utc'] = null;
            }

            // Ensure meeting_type is present
            $meeting['meeting_type'] = $meeting['meeting_type'] ?? 'special';
        }

        return $results;
    }

    public static function getMeetingDetails($meetingId)
    {
        $db = Database::getInstance();

        // 1. Basic info
        $stmt = $db->prepare("SELECT * FROM meetings WHERE id = ?");
        $stmt->execute([$meetingId]);
        $meeting = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$meeting)
            return null;

        // 2. Team assignments
        $stmt = $db->prepare("
            SELECT ma.*, m.name as member_name, i.name as instrument_name
            FROM meeting_assignments ma
            JOIN member m ON ma.member_id = m.id
            LEFT JOIN instruments i ON ma.instrument_id = i.id
            WHERE ma.meeting_id = ?
        ");
        $stmt->execute([$meetingId]);
        $meeting['team'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Setlists (from music db context if needed, but for now we look at meeting_setlists)
        // Note: The music database is separate, so we might need a join or two queries.
        // For simplicity, we assume we want playlist names (which might be in music DB).
        $meeting['setlists'] = self::getMeetingSetlists($meetingId);

        // Map frontend fields
        $meeting['instance_date'] = $meeting['start_at'];
        $meeting['start_datetime_utc'] = $meeting['start_at'];
        $meeting['end_datetime_utc'] = $meeting['end_at'];

        return $meeting;
    }

    private static function getMeetingSetlists($meetingId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT ms.*, m.name as assigned_by_name
            FROM meeting_setlists ms
            LEFT JOIN member m ON ms.assigned_by_id = m.id
            WHERE ms.meeting_id = ?
        ");
        $stmt->execute([$meetingId]);
        $setlists = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch playlist names from Music DB
        $musicDb = Database::getInstance('music');
        foreach ($setlists as &$sl) {
            $stmtP = $musicDb->prepare("SELECT name FROM playlists WHERE id = ?");
            $stmtP->execute([$sl['playlist_id']]);
            $sl['playlist_name'] = $stmtP->fetchColumn() ?: ("Setlist #" . $sl['playlist_id']);
        }

        return $setlists;
    }

    public static function createMeeting($data)
    {
        $db = Database::getInstance();

        // We handle both legacy and new fields
        $meetingType = $data['meeting_type'] ?? 'special';

        $sql = "INSERT INTO meetings (
                    calendar_id, title, description, start_at, end_at, 
                    location, category, created_by_member_id,
                    meeting_type, day_of_week, start_time, end_time
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            $data['calendar_id'],
            $data['title'],
            $data['description'] ?? null,
            $data['start_at'] ?? null,
            $data['end_at'] ?? null,
            $data['location'] ?? null,
            $data['category'] ?? null,
            $data['created_by_member_id'] ?? null,
            $meetingType,
            $data['day_of_week'] ?? null,
            $data['start_time'] ?? null,
            $data['end_time'] ?? null
        ]);

        return $db->lastInsertId();
    }

    public static function deleteMeeting($id)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("DELETE FROM meetings WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public static function updateMeeting($id, $data)
    {
        $db = Database::getInstance();
        $sql = "UPDATE meetings SET 
                    title = ?, description = ?, start_at = ?, end_at = ?, 
                    location = ?, category = ?, meeting_type = ?, 
                    day_of_week = ?, start_time = ?, end_time = ?
                WHERE id = ?";

        $stmt = $db->prepare($sql);
        return $stmt->execute([
            $data['title'],
            $data['description'] ?? null,
            $data['start_at'] ?? null,
            $data['end_at'] ?? null,
            $data['location'] ?? null,
            $data['category'] ?? null,
            $data['meeting_type'] ?? 'special',
            $data['day_of_week'] ?? null,
            $data['start_time'] ?? null,
            $data['end_time'] ?? null,
            $id
        ]);
    }

    public static function assignMember($meetingId, $memberId, $role, $instrumentId = null)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            INSERT INTO meeting_assignments (meeting_id, member_id, role, instrument_id, status)
            VALUES (?, ?, ?, ?, 'pending')
            ON DUPLICATE KEY UPDATE role = VALUES(role), instrument_id = VALUES(instrument_id)
        ");
        return $stmt->execute([$meetingId, $memberId, $role, $instrumentId]);
    }

    public static function ensureDefaultCalendar($churchId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT id FROM calendars WHERE church_id = ? LIMIT 1");
        $stmt->execute([$churchId]);
        $id = $stmt->fetchColumn();

        if (!$id) {
            $stmt = $db->prepare("INSERT INTO calendars (church_id, name) VALUES (?, 'General')");
            $stmt->execute([$churchId]);
            $id = $db->lastInsertId();
        }
        return $id;
    }

    public static function getCategories($churchId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM meeting_categories WHERE church_id = ? ORDER BY id DESC");
        $stmt->execute([$churchId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function createCategory($churchId, $name, $color = '#3d68df', $icon = 'event')
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("INSERT IGNORE INTO meeting_categories (church_id, name, color, icon) VALUES (?, ?, ?, ?)");
        $stmt->execute([$churchId, $name, $color, $icon]);
        return $db->lastInsertId() ?: true;
    }
}
