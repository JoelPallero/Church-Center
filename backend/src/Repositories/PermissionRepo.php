<?php

namespace App\Repositories;

use App\Database;
use PDO;

/**
 * Resolución de permisos: GLOBAL + CHURCH + SERVICE (union).
 * user_roles unifica asignaciones; el role define el scope.
 */
class PermissionRepo
{
    public static function getPermissions($memberId, $churchId = null)
    {
        $db = Database::getInstance();

        // 1. GLOBAL scope: superadmin bypass
        if (self::isSuperAdmin($memberId)) {
            $stmt = $db->query("SELECT name FROM permissions");
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        }

        // 2. CHURCH + SERVICE: permisos desde user_roles
        $sql = "
            SELECT DISTINCT p.name
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.member_id = ?
        ";
        $params = [$memberId];

        if ($churchId !== null && $churchId !== '' && (int)$churchId !== 0) {
            $sql .= " AND (ur.church_id = ? OR ur.church_id IS NULL)";
            $params[] = (int)$churchId;
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $permissions = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // 3. Specific Flags (Decoupled from Controller)
        $flagStmt = $db->prepare("SELECT can_create_teams FROM member WHERE id = ?");
        $flagStmt->execute([$memberId]);
        $canCreateTeams = $flagStmt->fetchColumn();
        if ($canCreateTeams) {
            $permissions[] = 'team.create';
        }

        return array_values(array_unique($permissions));
    }

    public static function isSuperAdmin($memberId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.member_id = ? AND r.name = 'superadmin' AND r.scope = 'GLOBAL'
              AND ur.church_id IS NULL AND ur.service_id IS NULL
        ");
        $stmt->execute([$memberId]);
        return (bool) $stmt->fetch();
    }

    public static function getServiceRoles($memberId, $churchId = null)
    {
        $db = Database::getInstance();
        if (self::isSuperAdmin($memberId)) {
            $stmt = $db->query("SELECT 'superadmin' as name, id as service_id, `key` as service_key FROM services WHERE active = 1");
            return $stmt->fetchAll();
        }
        $sql = "
            SELECT r.name, COALESCE(ur.service_id, r.service_id) as service_id, s.`key` as service_key
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            LEFT JOIN services s ON s.id = COALESCE(ur.service_id, r.service_id)
            WHERE ur.member_id = ? AND s.id IS NOT NULL
        ";
        $params = [$memberId];
        if ($churchId) {
            $sql .= " AND (ur.church_id = ? OR ur.church_id IS NULL)";
            $params[] = $churchId;
        }
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
}
