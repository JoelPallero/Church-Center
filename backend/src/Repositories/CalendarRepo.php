<?php

namespace App\Repositories;

use App\Database;
use PDO;

class CalendarRepo
{
    public static function getMeetingsByChurch($churchId, $start = null, $end = null)
    {
        $db = Database::getInstance();
        $sql = "SELECT m.*, c.name as calendar_name 
                FROM meetings m
                JOIN calendars c ON m.calendar_id = c.id
                WHERE c.church_id = ?";

        $params = [$churchId];

        if ($start) {
            $sql .= " AND m.start_at >= ?";
            $params[] = $start;
        }
        if ($end) {
            $sql .= " AND m.start_at <= ?";
            $params[] = $end;
        }

        $sql .= " ORDER BY m.start_at ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
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

        // We might need to fetch playlist names from Music DB
        // For now return raw IDs and assigned by info
        foreach ($setlists as &$sl) {
            $sl['playlist_name'] = "Setlist #" . $sl['playlist_id']; // Placeholder until music DB join
        }

        return $setlists;
    }

    public static function createMeeting($data)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            INSERT INTO meetings (calendar_id, title, description, start_at, end_at, location, created_by_member_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['calendar_id'],
            $data['title'],
            $data['description'] ?? null,
            $data['start_at'],
            $data['end_at'] ?? null,
            $data['location'] ?? null,
            $data['created_by_member_id'] ?? null
        ]);
        return $db->lastInsertId();
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
}
