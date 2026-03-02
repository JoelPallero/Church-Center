<?php

namespace App\Repositories;

use App\Database;
use PDO;

class AttendanceRepo
{
    public static function saveCount($meetingId, $adults, $children)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            INSERT INTO meeting_attendance (meeting_id, adults, children)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE adults = VALUES(adults), children = VALUES(children)
        ");
        return $stmt->execute([$meetingId, $adults, $children]);
    }

    public static function getCount($meetingId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM meeting_attendance WHERE meeting_id = ?");
        $stmt->execute([$meetingId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public static function addVisitor($meetingId, $data)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            INSERT INTO meeting_visitors (meeting_id, first_name, last_name, phone, email, is_first_time, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        return $stmt->execute([
            $meetingId,
            $data['first_name'],
            $data['last_name'] ?? null,
            $data['phone'] ?? null,
            $data['email'] ?? null,
            $data['is_first_time'] ?? 1,
            $data['notes'] ?? null
        ]);
    }

    public static function getVisitors($meetingId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM meeting_visitors WHERE meeting_id = ? ORDER BY created_at DESC");
        $stmt->execute([$meetingId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function deleteVisitor($visitorId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("DELETE FROM meeting_visitors WHERE id = ?");
        return $stmt->execute([$visitorId]);
    }

    public static function getReport($churchId, $start, $end)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT m.id, m.title, m.start_at, 
                   ma.adults, ma.children, ma.total,
                   (SELECT COUNT(*) FROM meeting_visitors mv WHERE mv.meeting_id = m.id) as visitors_count
            FROM meetings m
            JOIN calendars c ON m.calendar_id = c.id
            LEFT JOIN meeting_attendance ma ON m.id = ma.meeting_id
            WHERE c.church_id = ? AND m.start_at BETWEEN ? AND ?
            ORDER BY m.start_at DESC
        ");
        $stmt->execute([$churchId, $start, $end]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
