<?php

namespace App\Repositories;

use App\Database;
use PDO;

class UserRepo
{
    public static function findByEmail($email)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT u.*, m.name, m.church_id 
            FROM user_accounts u
            JOIN member m ON u.member_id = m.id
            WHERE u.email = ? AND u.is_active = 1
        ");
        $stmt->execute([$email]);
        return $stmt->fetch();
    }

    public static function getMemberData($memberId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM member WHERE id = ?");
        $stmt->execute([$memberId]);
        return $stmt->fetch();
    }

    public static function findById($memberId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT u.*, r.name as role_name 
            FROM user_accounts u
            LEFT JOIN user_global_roles ugr ON u.member_id = ugr.member_id
            LEFT JOIN roles r ON ugr.role_id = r.id
            WHERE u.member_id = ? AND u.is_active = 1
        ");
        $stmt->execute([$memberId]);
        return $stmt->fetch();
    }

    public static function getAllWithChurch($churchId = null)
    {
        $db = Database::getInstance();
        $sql = "
            SELECT m.*, r.name as role_name, r.display_name as role_display, c.name as church_name
            FROM member m
            LEFT JOIN church c ON m.church_id = c.id
            LEFT JOIN services s ON s.key = 'church_center'
            LEFT JOIN user_service_roles usr ON m.id = usr.member_id AND (m.church_id = usr.church_id OR m.church_id IS NULL) AND usr.service_id = s.id
            LEFT JOIN roles r ON usr.role_id = r.id
            WHERE m.status != 'deleted'
        ";
        $params = [];
        if ($churchId) {
            $sql .= " AND m.church_id = ?";
            $params[] = $churchId;
        }
        $sql .= " ORDER BY m.created_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function createMember($data)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            INSERT INTO member (church_id, name, surname, email, phone, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['church_id'] ?? null,
            $data['name'],
            $data['surname'] ?? '',
            $data['email'],
            $data['phone'] ?? null,
            $data['status'] ?? 'pending'
        ]);
        return $db->lastInsertId();
    }

    public static function updateStatus($memberId, $status)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("UPDATE member SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $memberId]);
    }

    public static function assignRole($memberId, $churchId, $roleId, $serviceKey = 'church_center')
    {
        $db = Database::getInstance();

        // 1. Get service ID
        $sStmt = $db->prepare("SELECT id FROM services WHERE `key` = ?");
        $sStmt->execute([$serviceKey]);
        $serviceId = $sStmt->fetchColumn();

        if (!$serviceId)
            return false;

        // 2. Assign in user_service_roles
        $stmt = $db->prepare("
            INSERT INTO user_service_roles (member_id, church_id, service_id, role_id)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE role_id = VALUES(role_id)
        ");
        return $stmt->execute([$memberId, $churchId, $serviceId, $roleId]);
    }

    public static function updateMemberRole($memberId, $roleId)
    {
        $member = self::getMemberData($memberId);
        if (!$member)
            return false;
        return self::assignRole($memberId, $member['church_id'], $roleId, 'church_center');
    }
}
