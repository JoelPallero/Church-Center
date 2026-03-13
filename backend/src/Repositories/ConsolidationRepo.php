<?php

namespace App\Repositories;

use App\Database;
use PDO;

class ConsolidationRepo
{
    public static function saveCount($meetingId, $adults, $children, $newPeople = 0)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            INSERT INTO meeting_attendance (meeting_id, adults, children, new_people)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE adults = VALUES(adults), children = VALUES(children), new_people = VALUES(new_people)
        ");
        return $stmt->execute([$meetingId, $adults, $children, $newPeople]);
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

        // 1. Add to meeting_visitors (local meeting log)
        $stmt1 = $db->prepare("
            INSERT INTO meeting_visitors (meeting_id, first_name, surname, phone, email, is_first_time, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt1->execute([
            $meetingId,
            $data['first_name'],
            $data['surname'] ?? null,
            $data['phone'] ?? null,
            $data['email'] ?? null,
            $data['is_first_time'] ?? 1,
            $data['notes'] ?? null
        ]);

        // 2. Add to central 'visitors' table if it's their first time
        if ($data['is_first_time'] ?? true) {
            $stmtChurch = $db->prepare("
                SELECT c.church_id 
                FROM meetings m 
                JOIN calendars c ON m.calendar_id = c.id 
                WHERE m.id = ?
            ");
            $stmtChurch->execute([$meetingId]);
            $churchId = $stmtChurch->fetchColumn();

            if ($churchId) {
                $stmt2 = $db->prepare("
                    INSERT INTO visitors (church_id, first_name, surname, whatsapp, email, first_meeting_id, prayer_requests)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    surname = VALUES(surname),
                    first_meeting_id = IFNULL(first_meeting_id, VALUES(first_meeting_id)),
                    prayer_requests = IFNULL(prayer_requests, VALUES(prayer_requests))
                ");
                $stmt2->execute([
                    $churchId,
                    $data['first_name'],
                    $data['surname'] ?? null,
                    $data['phone'] ?? null,
                    $data['email'] ?? null,
                    $meetingId,
                    $data['notes'] ?? null
                ]);
            }
        }

        return true;
    }

    public static function getVisitors($meetingId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM meeting_visitors WHERE meeting_id = ? ORDER BY id DESC");
        $stmt->execute([$meetingId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function deleteVisitor($visitorId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("DELETE FROM meeting_visitors WHERE id = ?");
        return $stmt->execute([$visitorId]);
    }

    public static function getVisitorsDatabase($churchId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT v.*, m.title as first_meeting_title, m.start_at as first_visit_date,
                   (SELECT COUNT(*) FROM visitor_follow_up f WHERE f.visitor_id = v.id) as follow_up_count
            FROM visitors v
            LEFT JOIN meetings m ON v.first_meeting_id = m.id
            WHERE v.church_id = ?
            ORDER BY v.id DESC
        ");
        $stmt->execute([$churchId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function addFollowUp($visitorId, $data, $memberId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            INSERT INTO visitor_follow_up (visitor_id, contact_date, contact_method, comments, created_by_member_id)
            VALUES (?, ?, ?, ?, ?)
        ");
        return $stmt->execute([
            $visitorId,
            $data['date'] ?? date('Y-m-d'),
            $data['method'] ?? 'WhatsApp',
            $data['comments'] ?? '',
            $memberId
        ]);
    }

    public static function getFollowUps($visitorId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT f.*, m.name as created_by_name
            FROM visitor_follow_up f
            LEFT JOIN member m ON f.created_by_member_id = m.id
            WHERE f.visitor_id = ?
            ORDER BY f.contact_date DESC
        ");
        $stmt->execute([$visitorId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function getReport($churchId, $start, $end)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT m.id, m.title, m.start_at, 
                   ma.adults, ma.children, ma.new_people as visitors_count, (IFNULL(ma.adults,0) + IFNULL(ma.children,0)) as total,
                   (SELECT COUNT(*) FROM meeting_visitors mv WHERE mv.meeting_id = m.id) as db_visitors_count
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
