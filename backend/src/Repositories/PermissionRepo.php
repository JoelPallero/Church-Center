<?php

namespace App\Repositories;

use App\Database;
use PDO;

class PermissionRepo
{
    public static function getPermissions($memberId, $churchId = null)
    {
        $db = Database::getInstance();

        // 1. Check if superadmin (global bypass)
        if (self::isSuperAdmin($memberId)) {
            $stmt = $db->query("SELECT name FROM permissions");
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        }

        // 2. Regular permissions from service roles
        // If churchId is 0 (General), we check permissions in ANY of the user's assigned churches.
        // This allows a Leader from Church A to read a Global Song (church_id 0).
        $sql = "
            SELECT DISTINCT p.name 
            FROM user_service_roles usr
            JOIN role_permissions rp ON usr.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE usr.member_id = ?
        ";

        $params = [$memberId];
        
        // Only apply church filter if it's a specific church (not 0/General)
        if ($churchId !== null && $churchId !== '' && (int)$churchId !== 0) {
            $sql .= " AND (usr.church_id = ? OR usr.church_id = 0)";
            $params[] = (int)$churchId;
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $permissions = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // 3. Pastor Check (Church-level fallback)
        // If the user is a pastor, they get full permissions for their church or general context.
        $pastorSql = "SELECT 1 FROM user_service_roles usr JOIN roles r ON usr.role_id = r.id WHERE usr.member_id = ? AND r.name = 'pastor'";
        $pastorParams = [$memberId];
        if ($churchId !== null && $churchId !== '' && (int)$churchId !== 0) {
            $pastorSql .= " AND usr.church_id = ?";
            $pastorParams[] = (int)$churchId;
        }
        $pStmt = $db->prepare($pastorSql);
        $pStmt->execute($pastorParams);
        if ($pStmt->fetch()) {
            $all = $db->query("SELECT name FROM permissions")->fetchAll(PDO::FETCH_COLUMN);
            $permissions = array_values(array_unique(array_merge($permissions, $all)));
        }

        return $permissions;
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

    public static function getServiceRoles($memberId, $churchId = null)
    {
        $db = Database::getInstance();
        $sql = "
            SELECT r.name, r.service_id, s.key as service_key
            FROM user_service_roles usr
            JOIN roles r ON usr.role_id = r.id
            JOIN services s ON r.service_id = s.id
            WHERE usr.member_id = ?
        ";

        $params = [$memberId];
        if ($churchId) {
            $sql .= " AND usr.church_id = ?";
            $params[] = $churchId;
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
}
