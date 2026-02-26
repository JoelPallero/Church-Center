<?php

namespace App\Repositories;

use App\Database;
use PDO;

class PermissionRepo
{
    public static function getPermissions($memberId)
    {
        $db = Database::getInstance();

        // 1. Check if superadmin (global role)
        // Bypass if user has a role with name 'superadmin' in user_global_roles
        $stmt = $db->prepare("
            SELECT 1 FROM user_global_roles ugr
            JOIN roles r ON ugr.role_id = r.id
            WHERE ugr.member_id = ? AND r.name = 'superadmin'
        ");
        $stmt->execute([$memberId]);

        if ($stmt->fetch()) {
            $stmt = $db->query("SELECT name FROM permissions");
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        }

        // 2. Regular permissions from service roles
        $stmt = $db->prepare("
            SELECT DISTINCT p.name 
            FROM user_service_roles usr
            JOIN role_permissions rp ON usr.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE usr.member_id = ?
        ");
        $stmt->execute([$memberId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public static function isSuperAdmin($memberId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT 1 FROM user_global_roles ugr
            JOIN roles r ON ugr.role_id = r.id
            WHERE ugr.member_id = ? AND r.name = 'superadmin'
        ");
        $stmt->execute([$memberId]);
        return (bool) $stmt->fetch();
    }

    public static function getServiceRoles($memberId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT r.name, r.service_id, s.key as service_key
            FROM user_service_roles usr
            JOIN roles r ON usr.role_id = r.id
            JOIN services s ON r.service_id = s.id
            WHERE usr.member_id = ?
        ");
        $stmt->execute([$memberId]);
        return $stmt->fetchAll();
    }
}
