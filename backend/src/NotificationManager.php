<?php
/**
 * NotificationManager.php
 */

require_once __DIR__ . '/../config/Database.php';

class NotificationManager
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create($memberId, $type, $message, $link = null)
    {
        $sql = "INSERT INTO notifications (member_id, type, message, link, is_read, created_at)
                VALUES (:mid, :type, :msg, :link, 0, NOW())";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':mid' => $memberId,
            ':type' => $type,
            ':msg' => $message,
            ':link' => $link
        ]);
    }

    public function listForUser($memberId)
    {
        $sql = "SELECT * FROM notifications WHERE member_id = :mid ORDER BY created_at DESC LIMIT 50";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':mid' => $memberId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function markAsRead($id, $memberId)
    {
        $sql = "UPDATE notifications SET is_read = 1 WHERE id = :id AND member_id = :mid";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':id' => $id, ':mid' => $memberId]);
    }

    public function getUnreadCount($memberId)
    {
        $sql = "SELECT COUNT(*) FROM notifications WHERE member_id = :mid AND is_read = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':mid' => $memberId]);
        return $stmt->fetchColumn();
    }

    public function ensureProfileNotification($memberId, $message)
    {
        // Check if unread profile notification already exists
        $sql = "SELECT id FROM notifications WHERE member_id = :mid AND type = 'profile_incomplete' AND is_read = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':mid' => $memberId]);
        if ($stmt->fetch())
            return; // Already exists

        return $this->create($memberId, 'profile_incomplete', $message, '/profile');
    }
}
