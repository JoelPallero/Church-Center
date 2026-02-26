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
}
