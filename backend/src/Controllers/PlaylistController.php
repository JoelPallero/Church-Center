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

        // If churchId is not provided or is 0, and user is not superadmin, 
        // we use their own church for context.
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
            $this->create($memberId);
        }
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

    private function create($memberId)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $name = $data['name'] ?? null;
        $churchId = $data['churchId'] ?? $data['church_id'] ?? null;

        if (!$churchId) {
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? null;
        }

        if (!$name || !$churchId) {
            Response::error("Name and Church ID required", 400);
        }

        $id = PlaylistRepo::create(
            $churchId,
            $name,
            $memberId,
            $data['description'] ?? '',
            $data['groupId'] ?? $data['group_id'] ?? null
        );

        if ($id && isset($data['songs']) && is_array($data['songs'])) {
            foreach ($data['songs'] as $index => $songId) {
                PlaylistRepo::addSong($id, $songId, $index);
            }
        }

        if ($id) {
            \App\Repositories\ActivityRepo::log($churchId, $memberId, 'created', 'playlist', $id, ['name' => $name]);
        }

        Response::json(['success' => !!$id, 'id' => $id, 'message' => 'Playlist created']);
    }
}
