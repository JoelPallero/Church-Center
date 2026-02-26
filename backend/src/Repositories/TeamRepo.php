<?php

namespace App\Repositories;

use App\Database;
use PDO;

class TeamRepo
{
    public static function create($churchId, $areaId, $name, $description = null)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("INSERT INTO groups (church_id, area_id, name, description) VALUES (?, ?, ?, ?)");
        $stmt->execute([$churchId, $areaId, $name, $description]);
        return $db->lastInsertId();
    }

    public static function getByChurch($churchId, $areaId = null)
    {
        $db = Database::getInstance();
        $sql = "SELECT g.*, a.name as area_name, gm.member_id as leader_id, m.name as leader_name 
                FROM groups g
                LEFT JOIN areas a ON g.area_id = a.id
                LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.role_in_group = 'leader'
                LEFT JOIN member m ON gm.member_id = m.id
                WHERE g.church_id = ?";

        $params = [$churchId];

        if ($areaId) {
            $sql .= " AND g.area_id = ?";
            $params[] = $areaId;
        }

        $sql .= " ORDER BY g.name ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function assignMember($groupId, $memberId, $role = 'member')
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("INSERT INTO group_members (group_id, member_id, role_in_group) 
                             VALUES (?, ?, ?) 
                             ON DUPLICATE KEY UPDATE role_in_group = VALUES(role_in_group)");
        return $stmt->execute([$groupId, $memberId, $role]);
    }
}
