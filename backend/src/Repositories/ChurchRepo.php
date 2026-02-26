<?php

namespace App\Repositories;

use App\Database;
use PDO;

class ChurchRepo
{
    public static function findById($id)
    {
        if (!$id)
            return null;
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("SELECT id, name, slug, is_active FROM church WHERE id = ?");
            $stmt->execute([$id]);
            return $stmt->fetch();
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("ChurchRepo::findById error: " . $e->getMessage());
            return null;
        }
    }

    public static function getAll()
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->query("SELECT id, name, slug, is_active FROM church ORDER BY name ASC");
            return $stmt->fetchAll();
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("ChurchRepo::getAll error: " . $e->getMessage());
            return [];
        }
    }

    public static function create($name, $slug)
    {
        $db = Database::getInstance();

        // 1. Slug enumeration logic
        $originalSlug = $slug;
        $counter = 1;

        while (true) {
            $stmt = $db->prepare("SELECT COUNT(*) FROM church WHERE slug = ?");
            $stmt->execute([$slug]);
            if ($stmt->fetchColumn() == 0) {
                break;
            }
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        // 2. Insert church
        $stmt = $db->prepare("INSERT INTO church (name, slug, is_active) VALUES (?, ?, 1)");
        $stmt->execute([$name, $slug]);
        return $db->lastInsertId();
    }

    public static function getByMember($memberId)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                SELECT DISTINCT c.id, c.name, c.slug, c.is_active
                FROM church c
                JOIN user_service_roles usr ON c.id = usr.church_id
                WHERE usr.member_id = ?
                ORDER BY c.name ASC
            ");
            $stmt->execute([$memberId]);
            return $stmt->fetchAll();
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("ChurchRepo::getByMember error: " . $e->getMessage());
            return [];
        }
    }

    public static function update($id, $name, $slug)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("UPDATE church SET name = ?, slug = ? WHERE id = ?");
        return $stmt->execute([$name, $slug, $id]);
    }

    public static function delete($id)
    {
        $db = Database::getInstance();

        try {
            $db->beginTransaction();

            // 1. Delete user service roles
            $stmt = $db->prepare("DELETE FROM user_service_roles WHERE church_id = ?");
            $stmt->execute([$id]);

            // 2. Delete group members
            $stmt = $db->prepare("DELETE FROM group_members WHERE group_id IN (SELECT id FROM groups WHERE church_id = ?)");
            $stmt->execute([$id]);

            // 3. Delete groups
            $stmt = $db->prepare("DELETE FROM groups WHERE church_id = ?");
            $stmt->execute([$id]);

            // 4. Delete areas
            $stmt = $db->prepare("DELETE FROM areas WHERE church_id = ?");
            $stmt->execute([$id]);

            // 5. Delete user accounts (linked to members of this church)
            $stmt = $db->prepare("DELETE FROM user_accounts WHERE member_id IN (SELECT id FROM member WHERE church_id = ?)");
            $stmt->execute([$id]);

            // 6. Delete members
            $stmt = $db->prepare("DELETE FROM member WHERE church_id = ?");
            $stmt->execute([$id]);

            // 7. Deactivate the church
            $stmt = $db->prepare("UPDATE church SET is_active = 0 WHERE id = ?");
            $result = $stmt->execute([$id]);

            $db->commit();
            return $result;
        } catch (\Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }
    public static function restore($id)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("UPDATE church SET is_active = 1 WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
