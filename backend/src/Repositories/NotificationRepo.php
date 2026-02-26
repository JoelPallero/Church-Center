<?php

namespace App\Repositories;

use App\Database;
use PDO;

class NotificationRepo
{
    public static function getByMember($memberId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT * FROM notifications 
            WHERE member_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        ");
        $stmt->execute([$memberId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function getUnreadCount($memberId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT COUNT(*) FROM notifications WHERE member_id = ? AND is_read = 0");
        $stmt->execute([$memberId]);
        return (int) $stmt->fetchColumn();
    }

    public static function create($memberId, $type, $title, $message, $link = null)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            INSERT INTO notifications (member_id, type, title, message, link, is_read)
            VALUES (?, ?, ?, ?, ?, 0)
        ");
        return $stmt->execute([$memberId, $type, $title, $message, $link]);
    }

    public static function markAsRead($notificationId, $memberId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND member_id = ?");
        return $stmt->execute([$notificationId, $memberId]);
    }

    public static function markAllAsRead($memberId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE member_id = ?");
        return $stmt->execute([$memberId]);
    }
}
