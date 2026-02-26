<?php

namespace App\Repositories;

use App\Database;
use PDO;

class AreaRepo
{
    public static function create($churchId, $name, $description = null)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("INSERT INTO areas (church_id, name, description) VALUES (?, ?, ?)");
        return $stmt->execute([$churchId, $name, $description]);
    }

    public static function getByChurch($churchId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM areas WHERE church_id = ? ORDER BY name ASC");
        $stmt->execute([$churchId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function update($id, $name, $description = null)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("UPDATE areas SET name = ?, description = ? WHERE id = ?");
        return $stmt->execute([$name, $description, $id]);
    }

    public static function delete($id)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("DELETE FROM areas WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
