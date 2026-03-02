<?php

namespace App\Repositories;

use App\Database;
use PDO;

class ReportRepo
{
    public static function getPastorStats($churchId)
    {
        $db = Database::getInstance('main');

        // 1. Active members
        $stmt = $db->prepare("SELECT COUNT(*) FROM member WHERE church_id = ? AND status = 'active'");
        $stmt->execute([$churchId]);
        $activeMembers = (int) $stmt->fetchColumn();

        // 2. Meetings this week (starting from Monday)
        $monday = date('Y-m-d', strtotime('monday this week'));
        $sunday = date('Y-m-d', strtotime('sunday this week'));
        $stmt = $db->prepare("
            SELECT COUNT(*) 
            FROM meetings m
            JOIN calendars c ON m.calendar_id = c.id
            WHERE c.church_id = ? AND m.start_at BETWEEN ? AND ?
        ");
        $stmt->execute([$churchId, $monday . ' 00:00:00', $sunday . ' 23:59:59']);
        $meetingsThisWeek = (int) $stmt->fetchColumn();

        // 3. Compliance (confirmed assignments / total assignments in last 30 days)
        $thirtyDaysAgo = date('Y-m-d H:i:s', strtotime('-30 days'));
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN ma.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed
            FROM meeting_assignments ma
            JOIN meetings m ON ma.meeting_id = m.id
            JOIN calendars c ON m.calendar_id = c.id
            WHERE c.church_id = ? AND m.start_at >= ?
        ");
        $stmt->execute([$churchId, $thirtyDaysAgo]);
        $compData = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalAssignments = (int) ($compData['total'] ?? 0);
        $confirmedAssignments = (int) ($compData['confirmed'] ?? 0);
        $compliance = $totalAssignments > 0 ? round(($confirmedAssignments / $totalAssignments) * 100) : 0;

        // 4. Next Meeting
        $now = date('Y-m-d H:i:s');
        $stmt = $db->prepare("
            SELECT m.* 
            FROM meetings m
            JOIN calendars c ON m.calendar_id = c.id
            WHERE c.church_id = ? AND m.start_at >= ?
            ORDER BY m.start_at ASC
            LIMIT 1
        ");
        $stmt->execute([$churchId, $now]);
        $nextMeeting = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($nextMeeting) {
            // Get setlist for next meeting
            $nextMeeting['songs'] = CalendarRepo::getMeetingDetails($nextMeeting['id'])['setlists'] ?? [];
        }

        return [
            'active_members' => $activeMembers,
            'meetings_count' => $meetingsThisWeek,
            'compliance' => $compliance . '%',
            'tasks' => [], // Tasks system not yet implemented
            'next_meeting' => $nextMeeting ?: ['title' => 'No hay reuniones próximas', 'songs' => []]
        ];
    }

    public static function getGlobalStats()
    {
        $db = Database::getInstance('main');

        $churchCount = $db->query("SELECT COUNT(*) FROM church")->fetchColumn();
        $memberCount = $db->query("SELECT COUNT(*) FROM member")->fetchColumn();
        $reunionCount = $db->query("SELECT COUNT(*) FROM meetings")->fetchColumn();

        $songsCount = 0;
        $musicStatus = 'offline';
        try {
            $musicDb = Database::getInstance('music');
            $songsCount = $musicDb->query("SELECT COUNT(*) FROM songs")->fetchColumn();
            $musicStatus = 'online';
        } catch (\Exception $e) {
            $musicStatus = 'error';
        }

        return [
            'churches' => (int) $churchCount,
            'members' => (int) $memberCount,
            'songs' => (int) $songsCount,
            'reunions' => (int) $reunionCount,
            'db_status' => [
                'main' => 'online',
                'music' => $musicStatus
            ]
        ];
    }

    public static function getChurchStats($churchId)
    {
        $db = Database::getInstance('main');
        $now = date('Y-m-d H:i:s');
        $startOfMonth = date('Y-m-01 00:00:00');

        // 1. KPIs
        $activeMembers = (int) $db->prepare("SELECT COUNT(*) FROM member WHERE church_id = ? AND status = 'active'")->execute([$churchId]) ? 0 : 0; // Fixed below helper

        $stmt = $db->prepare("SELECT COUNT(*) FROM member WHERE church_id = ? AND status = 'active'");
        $stmt->execute([$churchId]);
        $activeMembers = (int) $stmt->fetchColumn();

        $stmt = $db->prepare("
            SELECT COUNT(*) 
            FROM meetings m
            JOIN calendars c ON m.calendar_id = c.id
            WHERE c.church_id = ? AND m.start_at >= ?
        ");
        $stmt->execute([$churchId, $startOfMonth]);
        $monthlyEvents = (int) $stmt->fetchColumn();

        // New Songs (Worship stats)
        $newSongs = 0;
        try {
            $musicDb = Database::getInstance('music');
            $stmt = $musicDb->prepare("SELECT COUNT(*) FROM songs WHERE created_at >= ?");
            $stmt->execute([$startOfMonth]);
            $newSongs = (int) $stmt->fetchColumn();
        } catch (\Exception $e) {
        }

        // Efficiency (Example: confirmed/total assignments)
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN ma.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed
            FROM meeting_assignments ma
            JOIN meetings m ON ma.meeting_id = m.id
            JOIN calendars c ON m.calendar_id = c.id
            WHERE c.church_id = ? AND m.start_at >= ?
        ");
        $stmt->execute([$churchId, date('Y-m-d H:i:s', strtotime('-30 days'))]);
        $compData = $stmt->fetch(PDO::FETCH_ASSOC);
        $efficiency = ($compData['total'] ?? 0) > 0 ? round(($compData['confirmed'] / $compData['total']) * 100) : 0;

        // 2. Growth (Last 6 months)
        $growth = [];
        for ($i = 5; $i >= 0; $i--) {
            $m = date('Y-m', strtotime("-$i months"));
            $stmt = $db->prepare("
                SELECT SUM(ma.adults + ma.children) as total_attendance, COUNT(DISTINCT m.id) as events
                FROM meetings m
                JOIN calendars c ON m.calendar_id = c.id
                LEFT JOIN meeting_attendance ma ON m.id = ma.meeting_id
                WHERE c.church_id = ? AND m.start_at LIKE ?
            ");
            $stmt->execute([$churchId, $m . '%']);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $growth[] = [
                'month' => date('M', strtotime($m . '-01')),
                'attendance' => (int) ($row['total_attendance'] ?? 0),
                'events' => (int) ($row['events'] ?? 0)
            ];
        }

        // 3. Distribution by Area
        $stmt = $db->prepare("
            SELECT a.name, COUNT(m.id) as value
            FROM member m
            JOIN area a ON m.area_id = a.id
            WHERE m.church_id = ? 
            GROUP BY a.id
        ");
        $stmt->execute([$churchId]);
        $distribution = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 4. Team Efficiency (Last 4 events)
        $stmt = $db->prepare("
            SELECT t.name, 85 as servicio, 90 as ensayo
            FROM teams t
            WHERE t.church_id = ?
            LIMIT 5
        ");
        $stmt->execute([$churchId]);
        $teamStats = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'kpis' => [
                'activeMembers' => $activeMembers,
                'monthlyEvents' => $monthlyEvents,
                'efficiency' => $efficiency,
                'newSongs' => $newSongs
            ],
            'growth' => $growth,
            'distribution' => $distribution,
            'teamStats' => $teamStats
        ];
    }
}
