<?php

namespace App\Controllers;

use App\Repositories\PlaylistRepo;
use App\Middleware\PermissionMiddleware;
use App\Helpers\Response;

class PlaylistController
{
    public function handle($memberId, $action, $method)
    {
        $churchId = $_GET['church_id'] ?? $_GET['churchId'] ?? null;
        $data = [];
        if ($method === 'POST' || $method === 'PUT') {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true) ?? [];
            if (!$churchId) {
                $churchId = $data['churchId'] ?? $data['church_id'] ?? null;
            }
        }

        $isSuperAdmin = \App\Repositories\PermissionRepo::isSuperAdmin($memberId);
        if (!$isSuperAdmin && ($churchId === null || (int) $churchId === 0)) {
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? null;
        }

        PermissionMiddleware::require($memberId, 'calendar.read', $churchId);

        if ($method === 'GET') {
            if (is_numeric($action)) {
                $this->show($action);
            } else {
                $this->list($memberId, $churchId);
            }
        } elseif ($method === 'POST') {
            PermissionMiddleware::requireAnyRole($memberId, ['pastor', 'leader', 'coordinator'], $churchId);
            if ($action === 'add-song') {
                $this->addSong($data);
            } elseif ($action === 'remove-song') {
                $this->removeSong($data);
            } elseif ($action === 'duplicate') {
                $this->duplicate($data, $memberId);
            } else {
                $this->create($memberId, $churchId, $data);
            }
        } elseif ($method === 'PUT') {
            PermissionMiddleware::requireAnyRole($memberId, ['pastor', 'leader', 'coordinator'], $churchId);
            if (is_numeric($action)) {
                $this->update($action, $data);
            }
        } elseif ($method === 'DELETE') {
            PermissionMiddleware::requireAnyRole($memberId, ['pastor', 'leader', 'coordinator'], $churchId);
            if (is_numeric($action)) {
                $this->delete($action);
            }
        }
    }

    private function update($id, $data)
    {
        $success = PlaylistRepo::update($id, $data);
        Response::json(['success' => $success, 'message' => $success ? 'Playlist updated' : 'Failed to update playlist']);
    }

    private function delete($id)
    {
        $success = PlaylistRepo::delete($id);
        Response::json(['success' => $success, 'message' => $success ? 'Playlist deleted' : 'Failed to delete playlist']);
    }

    private function addSong($data)
    {
        $playlistId = $data['playlistId'] ?? $data['playlist_id'] ?? null;
        $songId = $data['songId'] ?? $data['song_id'] ?? null;
        $order = $data['order'] ?? 0;

        if (!$playlistId || !$songId) {
            Response::error("Playlist ID and Song ID required", 400);
        }

        $success = PlaylistRepo::addSong($playlistId, $songId, $order);
        Response::json(['success' => $success]);
    }

    private function removeSong($data)
    {
        $playlistId = $data['playlistId'] ?? $data['playlist_id'] ?? null;
        $songId = $data['songId'] ?? $data['song_id'] ?? null;

        if (!$playlistId || !$songId) {
            Response::error("Playlist ID and Song ID required", 400);
        }

        $success = PlaylistRepo::removeSong($playlistId, $songId);
        Response::json(['success' => $success]);
    }

    private function list($memberId, $churchId = null)
    {
        $groupId = $_GET['group_id'] ?? $_GET['groupId'] ?? null;

        if (!$churchId) {
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? null;
        }

        if (!$churchId) {
            Response::error("Church ID required", 400);
        }

        $roles = \App\Repositories\PermissionRepo::getServiceRoles($memberId, $churchId);
        $roleNames = array_map(fn($r) => $r['name'], $roles);
        $isSuper = \App\Repositories\PermissionRepo::isSuperAdmin($memberId);

        $isRestricted = !$isSuper && !in_array('pastor', $roleNames) && !in_array('leader', $roleNames) && !in_array('coordinator', $roleNames);

        if ($isRestricted) {
            $playlists = PlaylistRepo::getVisibleForMember($churchId, $memberId);
        } else {
            $playlists = PlaylistRepo::getByChurch($churchId, $groupId);
        }

        Response::json(['success' => true, 'playlists' => $playlists]);
    }

    private function show($id)
    {
        $db = \App\Database::getInstance('music');
        $stmt = $db->prepare("SELECT * FROM playlists WHERE id = ?");
        $stmt->execute([$id]);
        $playlist = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$playlist) {
            Response::error("Playlist not found", 404);
        }

        $songs = PlaylistRepo::getSongs($id);

        // Map songs to items expected by frontend if needed
        $items = array_map(function ($s) {
            return [
                'id' => $s['id'],
                'song' => $s, // Includes title, artist, etc.
                'songKey' => $s['original_key'] // Basic mapping
            ];
        }, $songs);

        $playlist['items'] = $items;

        Response::json(['success' => true, 'playlist' => $playlist]);
    }

    private function create($memberId, $churchId = null, $data = [])
    {
        $name = $data['name'] ?? null;
        if (!$churchId) {
            $churchId = $data['churchId'] ?? $data['church_id'] ?? null;
        }

        if (!$churchId) {
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? null;
        }

        if (!$name || !$churchId) {
            Response::error("Name and Church ID required", 400);
        }

        $meetingIds = $data['meetingIds'] ?? $data['meeting_ids'] ?? [];
        if (!is_array($meetingIds)) $meetingIds = [$meetingIds];
        $meetingIds = array_filter($meetingIds);

        $createdIds = [];

        if (empty($meetingIds)) {
            // Simple creation
            $id = PlaylistRepo::create($churchId, $name, $memberId, $data['description'] ?? '', $data['groupId'] ?? null);
            if ($id) {
                $createdIds[] = $id;
                $this->addSongsToPlaylist($id, $data['songs'] ?? []);
            }
        } else {
            // Creation for each meeting (with automatic names if provided in data, or mapping logic)
            foreach ($meetingIds as $mId) {
                $meetingName = $data['meetingNames'][$mId] ?? $name;
                $pId = PlaylistRepo::create($churchId, $meetingName, $memberId, $data['description'] ?? '', $data['groupId'] ?? null);
                if ($pId) {
                    $createdIds[] = $pId;
                    $this->addSongsToPlaylist($pId, $data['songs'] ?? []);
                    PlaylistRepo::assignToMeeting($mId, $pId, $memberId);
                }
            }
        }

        if (!empty($createdIds)) {
            \App\Repositories\ActivityRepo::log($churchId, $memberId, 'created', 'playlist', $createdIds[0], ['count' => count($createdIds)]);
        }

        Response::json(['success' => !empty($createdIds), 'ids' => $createdIds, 'message' => 'Playlist(s) created']);
    }

    private function addSongsToPlaylist($playlistId, $songs) {
        if (!is_array($songs)) return;
        foreach ($songs as $index => $songId) {
            PlaylistRepo::addSong($playlistId, $songId, $index);
        }
    }

    private function duplicate($data, $memberId) {
        $playlistId = $data['playlistId'] ?? null;
        $newName = $data['name'] ?? null;
        $customSongs = $data['songs'] ?? null;

        if (!$playlistId || !$newName) {
            Response::error("Playlist ID and Name required", 400);
        }

        $newId = PlaylistRepo::duplicate($playlistId, $newName, $memberId);
        
        if ($newId) {
            // If custom songs provided, replace the ones copied by duplicate()
            if (is_array($customSongs) && !empty($customSongs)) {
                // Clear copied songs
                $db = \App\Database::getInstance('music');
                $db->prepare("DELETE FROM playlist_songs WHERE playlist_id = ?")->execute([$newId]);
                // Add new ones
                $this->addSongsToPlaylist($newId, $customSongs);
            }

            if (isset($data['meetingId'])) {
                PlaylistRepo::assignToMeeting($data['meetingId'], $newId, $memberId);
            }
        }

        Response::json(['success' => !!$newId, 'id' => $newId]);
    }
}
