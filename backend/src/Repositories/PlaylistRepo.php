<?php

namespace App\Repositories;

use App\Database;
use PDO;

class PlaylistRepo
{
    public static function getByChurch($churchId)
    {
        try {
            $db = Database::getInstance('music');
            $stmt = $db->prepare("SELECT * FROM playlists WHERE church_id = ? AND is_active = 1 ORDER BY created_at DESC");
            $stmt->execute([$churchId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("PlaylistRepo::getByChurch error: " . $e->getMessage());
            return [];
        }
    }

    public static function create($churchId, $name, $createdBy, $description = null)
    {
        try {
            $db = Database::getInstance('music');
            $stmt = $db->prepare("INSERT INTO playlists (church_id, name, description, created_by) VALUES (?, ?, ?, ?)");
            $stmt->execute([$churchId, $name, $description, $createdBy]);
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
