<?php

namespace App\Repositories;

use App\Database;
use PDO;

class SongRepo
{
    public static function getAll($churchId = null)
    {
        try {
            $db = Database::getInstance('music');
            $sql = "SELECT * FROM songs WHERE is_active = 1";
            $params = [];

            if ($churchId !== null) {
                // Include specific church songs AND universal songs (id 0)
                $sql .= " AND (church_id = ? OR church_id = 0)";
                $params[] = $churchId;
            }

            $sql .= " ORDER BY title ASC";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (\Exception $e) {
            // Log the error but don't break the whole app if music db is down
            \App\Helpers\Logger::error("SongRepo::getAll error: " . $e->getMessage());
            return [];
        }
    }

    public static function findById($id)
    {
        try {
            $db = Database::getInstance('music');
            $stmt = $db->prepare("SELECT * FROM songs WHERE id = ?");
            $stmt->execute([$id]);
            return $stmt->fetch();
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("SongRepo::findById error: " . $e->getMessage());
            return null;
        }
    }

    public static function add($data)
    {
        try {
            $db = Database::getInstance('music');
            $stmt = $db->prepare("
                INSERT INTO songs (church_id, title, artist, original_key, tempo, content, category, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            ");
            $stmt->execute([
                $data['church_id'] ?? 0,
                $data['title'],
                $data['artist'],
                $data['original_key'] ?? '',
                $data['tempo'] ?? '',
                $data['content'] ?? '',
                $data['category'] ?? ''
            ]);
            return $db->lastInsertId();
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("SongRepo::add error: " . $e->getMessage());
            return false;
        }
    }

    public static function listPendingEdits()
    {
        try {
            $db = Database::getInstance('music');
            $stmt = $db->query("
                SELECT se.*, s.title as song_title 
                FROM song_edits se
                JOIN songs s ON se.song_id = s.id
                WHERE se.status = 'pending'
                ORDER BY se.created_at DESC
            ");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("SongRepo::listPendingEdits error: " . $e->getMessage());
            return [];
        }
    }

    public static function proposeEdit($songId, $memberId, $data)
    {
        try {
            $db = Database::getInstance('music');
            $stmt = $db->prepare("INSERT INTO song_edits (song_id, member_id, proposed_data) VALUES (?, ?, ?)");
            return $stmt->execute([$songId, $memberId, json_encode($data)]);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("SongRepo::proposeEdit error: " . $e->getMessage());
            return false;
        }
    }

    public static function resolveEdit($editId, $status)
    {
        try {
            $db = Database::getInstance('music');

            if ($status === 'approved') {
                // 1. Get the edit data
                $stmt = $db->prepare("SELECT * FROM song_edits WHERE id = ?");
                $stmt->execute([$editId]);
                $edit = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($edit) {
                    $proposedData = json_decode($edit['proposed_data'], true);
                    $songId = $edit['song_id'];

                    // 2. Build update query
                    $fields = [];
                    $params = [];
                    foreach ($proposedData as $key => $value) {
                        $fields[] = "$key = ?";
                        $params[] = $value;
                    }
                    $params[] = $songId;

                    if (!empty($fields)) {
                        $sql = "UPDATE songs SET " . implode(', ', $fields) . " WHERE id = ?";
                        $update = $db->prepare($sql);
                        $update->execute($params);
                    }
                }
            }

            // 3. Update status
            $stmt = $db->prepare("UPDATE song_edits SET status = ? WHERE id = ?");
            return $stmt->execute([$status, $editId]);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("SongRepo::resolveEdit error: " . $e->getMessage());
            return false;
        }
    }

    public static function delete($id)
    {
        try {
            $db = Database::getInstance('music');
            $stmt = $db->prepare("DELETE FROM songs WHERE id = ?");
            return $stmt->execute([$id]);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("SongRepo::delete error: " . $e->getMessage());
            return false;
        }
    }
}
