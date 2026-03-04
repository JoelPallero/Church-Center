<?php

namespace App\Repositories;

use App\Database;
use PDO;

class PlaylistRepo
{
    public static function getByChurch($churchId, $groupId = null)
    {
        try {
            $db = Database::getInstance('music');
            $sql = "SELECT * FROM playlists WHERE church_id = ? AND is_active = 1";
            $params = [$churchId];

            if ($groupId) {
                $sql .= " AND (group_id = ? OR group_id IS NULL)";
                $params[] = $groupId;
            }

            $sql .= " ORDER BY created_at DESC";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("PlaylistRepo::getByChurch error: " . $e->getMessage());
            return [];
        }
    }

    public static function getVisibleForMember($churchId, $memberId)
    {
        try {
            $mainDb = Database::getInstance();
            // Get IDs of leaders/coordinators from the same teams
            $stmt = $mainDb->prepare("
                SELECT DISTINCT gm2.member_id
                FROM group_members gm1
                JOIN group_members gm2 ON gm1.group_id = gm2.group_id
                WHERE gm1.member_id = ? AND gm2.role_in_group IN ('leader', 'coordinator')
            ");
            $stmt->execute([$memberId]);
            $allowedCreators = $stmt->fetchAll(PDO::FETCH_COLUMN);

            $allowedCreators[] = $memberId; // Always allow own
            $allowedCreators = array_values(array_unique(array_filter($allowedCreators)));

            $db = Database::getInstance('music');
            $placeholders = implode(',', array_fill(0, count($allowedCreators), '?'));
            $sql = "SELECT * FROM playlists WHERE church_id = ? AND is_active = 1 AND created_by IN ($placeholders) ORDER BY created_at DESC";

            $stmt = $db->prepare($sql);
            $stmt->execute(array_merge([$churchId], $allowedCreators));
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("PlaylistRepo::getVisibleForMember error: " . $e->getMessage());
            return [];
        }
    }

    public static function create($churchId, $name, $createdBy, $description = null, $groupId = null)
    {
        try {
            $db = Database::getInstance('music');
            $stmt = $db->prepare("INSERT INTO playlists (church_id, group_id, name, description, created_by) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$churchId, $groupId, $name, $description, $createdBy]);
            return $db->lastInsertId();
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("PlaylistRepo::create error: " . $e->getMessage());
            return false;
        }
    }

    public static function addSong($playlistId, $songId, $orderIndex = 0)
    {
        try {
            $db = Database::getInstance('music');
            $stmt = $db->prepare("
                INSERT INTO playlist_songs (playlist_id, song_id, order_index) 
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE order_index = VALUES(order_index)
            ");
            return $stmt->execute([$playlistId, $songId, $orderIndex]);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("PlaylistRepo::addSong error: " . $e->getMessage());
            return false;
        }
    }

    public static function getSongs($playlistId)
    {
        try {
            $db = Database::getInstance('music');
            $stmt = $db->prepare("
                SELECT s.*, ps.order_index 
                FROM songs s
                JOIN playlist_songs ps ON s.id = ps.song_id
                WHERE ps.playlist_id = ?
                ORDER BY ps.order_index ASC
            ");
            $stmt->execute([$playlistId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("PlaylistRepo::getSongs error: " . $e->getMessage());
            return [];
        }
    }
}
