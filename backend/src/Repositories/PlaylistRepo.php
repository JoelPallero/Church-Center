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

    public static function update($id, $data)
    {
        try {
            $db = Database::getInstance('music');
            $fields = [];
            $params = [];
            if (isset($data['name'])) {
                $fields[] = "name = ?";
                $params[] = $data['name'];
            }
            if (isset($data['description'])) {
                $fields[] = "description = ?";
                $params[] = $data['description'];
            }
            if (isset($data['group_id'])) {
                $fields[] = "group_id = ?";
                $params[] = $data['group_id'];
            }

            if (empty($fields)) return true;

            $params[] = $id;
            $stmt = $db->prepare("UPDATE playlists SET " . implode(', ', $fields) . " WHERE id = ?");
            return $stmt->execute($params);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("PlaylistRepo::update error: " . $e->getMessage());
            return false;
        }
    }

    public static function delete($id)
    {
        try {
            $db = Database::getInstance('music');
            $stmt = $db->prepare("UPDATE playlists SET is_active = 0 WHERE id = ?");
            return $stmt->execute([$id]);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("PlaylistRepo::delete error: " . $e->getMessage());
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

    public static function removeSong($playlistId, $songId)
    {
        try {
            $db = Database::getInstance('music');
            $stmt = $db->prepare("DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?");
            return $stmt->execute([$playlistId, $songId]);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("PlaylistRepo::removeSong error: " . $e->getMessage());
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

    public static function assignToMeeting($meetingId, $playlistId, $assignedById = null)
    {
        try {
            $db = Database::getInstance(); // Main DB
            $stmt = $db->prepare("
                INSERT INTO meeting_setlists (meeting_id, playlist_id, assigned_by_id) 
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE assigned_by_id = VALUES(assigned_by_id)
            ");
            $success = $stmt->execute([$meetingId, $playlistId, $assignedById]);
            
            if ($success) {
                self::notifySetlistAssignment($meetingId, $playlistId, $assignedById);
            }
            
            return $success;
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("PlaylistRepo::assignToMeeting error: " . $e->getMessage());
            return false;
        }
    }

    public static function notifySetlistAssignment($meetingId, $playlistId, $assignedById)
    {
        try {
            // 1. Get Meeting details
            $meeting = CalendarRepo::getMeetingDetails($meetingId);
            if (!$meeting) return;

            // 2. Get Playlist details
            $musicDb = Database::getInstance('music');
            $stmt = $musicDb->prepare("SELECT * FROM playlists WHERE id = ?");
            $stmt->execute([$playlistId]);
            $playlist = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$playlist) return;

            // 3. Get Songs
            $songs = self::getSongs($playlistId);

            // 4. Get Leader
            $leader = UserRepo::getMemberData($assignedById);
            $leaderName = $leader['name'] ?? 'Líder';

            // 5. Get Church
            $stmtC = Database::getInstance()->prepare("SELECT name FROM church WHERE id = ?");
            $stmtC->execute([$playlist['church_id']]);
            $churchName = $stmtC->fetchColumn() ?: 'Tu Iglesia';

            // 6. Get Recipients (Team Members)
            $groupId = $playlist['group_id'];
            $recipients = [];
            
            if ($groupId) {
                $recipients = TeamRepo::getTeamMemberEmails($groupId);
            } else {
                // If no group direct, find all groups led by this leader
                $teams = TeamRepo::getTeamsByLeader($assignedById);
                foreach ($teams as $team) {
                    $teamRecipients = TeamRepo::getTeamMemberEmails($team['id']);
                    $recipients = array_merge($recipients, $teamRecipients);
                }
            }

            // Remove duplicates and self
            $uniqueRecipients = [];
            foreach ($recipients as $r) {
                if ($r['email'] !== $leader['email']) {
                    $uniqueRecipients[$r['email']] = $r;
                }
            }

            if (empty($uniqueRecipients)) return;

            // 7. Send!
            \App\Helpers\MailHelper::sendSetlistNotification(
                $leaderName,
                $meeting,
                $songs,
                array_values($uniqueRecipients),
                $churchName
            );

        } catch (\Exception $e) {
            \App\Helpers\Logger::error("PlaylistRepo::notifySetlistAssignment error: " . $e->getMessage());
        }
    }

    public static function duplicate($playlistId, $newName, $memberId)
    {
        try {
            $db = Database::getInstance('music');
            
            // 1. Get original playlist
            $stmt = $db->prepare("SELECT * FROM playlists WHERE id = ?");
            $stmt->execute([$playlistId]);
            $original = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$original) return false;

            // 2. Create new playlist
            $newId = self::create(
                $original['church_id'],
                $newName,
                $memberId,
                $original['description'],
                $original['group_id']
            );

            if (!$newId) return false;

            // 3. Copy songs
            $songs = self::getSongs($playlistId);
            foreach ($songs as $s) {
                self::addSong($newId, $s['id'], $s['order_index']);
            }

            return $newId;
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("PlaylistRepo::duplicate error: " . $e->getMessage());
            return false;
        }
    }
}
