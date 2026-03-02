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

    public static function delete($groupId)
    {
        $db = Database::getInstance();
        try {
            $db->beginTransaction();
            $db->prepare("DELETE FROM group_members WHERE group_id = ?")->execute([$groupId]);
            $result = $db->prepare("DELETE FROM groups WHERE id = ?")->execute([$groupId]);
            $db->commit();
            return $result;
        } catch (\Exception $e) {
            if ($db->inTransaction())
                $db->rollBack();
            throw $e;
        }
    }

    public static function getTeamMembers($groupId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT m.id, m.name, gm.role_in_group 
            FROM member m
            JOIN group_members gm ON m.id = gm.member_id
            WHERE gm.group_id = ?
        ");
        $stmt->execute([$groupId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function assignMembersBulk($groupId, $memberIds)
    {
        $db = Database::getInstance();
        try {
            $db->beginTransaction();
            // Optional: Clear existing non-leader members? 
            // The frontend usually expects a sync or additive. 
            // Based on assignTeamBulk in peopleService, it's a sync usually.
            $db->prepare("DELETE FROM group_members WHERE group_id = ? AND role_in_group != 'leader'")->execute([$groupId]);

            foreach ($memberIds as $memberId) {
                // Check if already is a leader to avoid downgrading
                $stmt = $db->prepare("INSERT INTO group_members (group_id, member_id, role_in_group) 
                                     VALUES (?, ?, 'member') 
                                     ON DUPLICATE KEY UPDATE role_in_group = role_in_group");
                $stmt->execute([$groupId, $memberId]);
            }
            $db->commit();
            return true;
        } catch (\Exception $e) {
            if ($db->inTransaction())
                $db->rollBack();
            throw $e;
        }
    }

    public static function update($id, $data)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("UPDATE groups SET name = ?, description = ? WHERE id = ?");
        return $stmt->execute([$data['name'], $data['description'] ?? '', $id]);
    }

    public static function setLeader($groupId, $leaderId)
    {
        $db = Database::getInstance();
        try {
            $db->beginTransaction();
            // 1. Demote current leaders
            $db->prepare("DELETE FROM group_members WHERE group_id = ? AND role_in_group = 'leader'")->execute([$groupId]);
            // 2. Assign new leader
            self::assignMember($groupId, $leaderId, 'leader');
            $db->commit();
            return true;
        } catch (\Exception $e) {
            if ($db->inTransaction())
                $db->rollBack();
            throw $e;
        }
    }
}
