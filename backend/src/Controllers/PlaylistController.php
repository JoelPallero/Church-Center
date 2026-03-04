<?php

namespace App\Controllers;

use App\Repositories\PlaylistRepo;
use App\Middleware\PermissionMiddleware;
use App\Helpers\Response;

class PlaylistController
{
    public function handle($memberId, $action, $method)
    {
        $churchId = $_GET['church_id'] ?? null;
        if (!$churchId && $method === 'POST') {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);
            $churchId = $data['churchId'] ?? $data['church_id'] ?? null;
        }

        PermissionMiddleware::require($memberId, 'calendar.read', $churchId);

        if ($method === 'GET') {
            if (is_numeric($action)) {
                $this->show($action);
            } else {
                $this->list($memberId);
            }
        } elseif ($method === 'POST') {
            $this->create($memberId);
        }
    }

    private function list($memberId)
    {
        $churchId = $_GET['church_id'] ?? null;
        if (!$churchId) {
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? null;
        }

        if (!$churchId) {
            Response::error("Church ID required", 400);
        }

        $roles = \App\Repositories\PermissionRepo::getServiceRoles($memberId);
        $roleNames = array_map(fn($r) => $r['name'], $roles);
        $isSuper = \App\Repositories\PermissionRepo::isSuperAdmin($memberId);

        $isRestricted = !$isSuper && !in_array('pastor', $roleNames) && !in_array('leader', $roleNames) && !in_array('coordinator', $roleNames);

        if ($isRestricted) {
            $playlists = PlaylistRepo::getVisibleForMember($churchId, $memberId);
        } else {
            $playlists = PlaylistRepo::getByChurch($churchId);
        }

        Response::json(['success' => true, 'playlists' => $playlists]);
    }

    private function show($id)
    {
        $songs = PlaylistRepo::getSongs($id);
        Response::json(['success' => true, 'songs' => $songs]);
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

        $id = PlaylistRepo::create($churchId, $name, $memberId, $data['description'] ?? '');

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
