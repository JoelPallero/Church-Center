<?php

namespace App\Controllers;

use App\Middleware\PermissionMiddleware;
use App\Helpers\Response;

class SongController
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

        // If churchId is not provided or is 0 (General), and user is not superadmin, 
        // we use their own church for permission checking.
        $isSuperAdmin = \App\Repositories\PermissionRepo::isSuperAdmin($memberId);
        if (!$isSuperAdmin && ($churchId === null || (int) $churchId === 0)) {
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? null;
        }

        if ($method === 'GET') {
            if ($action === 'edits') {
                PermissionMiddleware::require($memberId, 'song.approve', $churchId);
                $this->listEdits($memberId);
            } elseif (is_numeric($action)) {
                $song = \App\Repositories\SongRepo::findById($action);
                $targetChurchId = $song['church_id'] ?? $churchId;
                PermissionMiddleware::require($memberId, 'song.read', $targetChurchId);
                $this->show($action);
            } else {
                PermissionMiddleware::require($memberId, 'song.read', $churchId);
                $this->list($memberId, $churchId);
            }
        } elseif ($method === 'POST') {
            if ($action === 'propose_edit') {
                $this->proposeEdit($memberId, $data);
            } elseif ($action === 'resolve_edit') {
                PermissionMiddleware::require($memberId, 'song.approve', $churchId);
                $this->resolveEdit($memberId, $data);
            } else {
                // Default POST is create
                PermissionMiddleware::require($memberId, 'song.create', $churchId);
                $this->create($memberId, $churchId, $data);
            }
        } elseif ($method === 'PUT') {
            // Edición
            if (is_numeric($action)) {
                $song = \App\Repositories\SongRepo::findById($action);
                if (!$song) {
                    return Response::error("Song not found", 404);
                }
                $targetChurchId = $song['church_id'] ?? $churchId;
                PermissionMiddleware::require($memberId, 'song.update', $targetChurchId);
                $this->update($action, $data);
            }
        } elseif ($method === 'DELETE') {
            // Baja
            if (is_numeric($action)) {
                $song = \App\Repositories\SongRepo::findById($action);
                if (!$song) {
                    return Response::error("Song not found", 404);
                }
                $targetChurchId = $song['church_id'] ?? $churchId;
                PermissionMiddleware::require($memberId, 'song.delete', $targetChurchId);
                $this->delete($action);
            }
        }
    }

    private function delete($id)
    {
        $success = \App\Repositories\SongRepo::delete($id);
        Response::json(['success' => $success, 'message' => $success ? 'Song deleted' : 'Failed to delete song']);
    }

    private function list($memberId, $churchId = null)
    {
        // Get songs. If $churchId is null (possible for SuperAdmin), we get EVERYTHING.
        $songs = \App\Repositories\SongRepo::getAll($churchId);

        // Enrich with church names
        $churches = \App\Repositories\ChurchRepo::getAll();
        $churchMap = [];
        foreach ($churches as $c) {
            $churchMap[$c['id']] = $c['name'];
        }

        $enrichedSongs = array_map(function ($song) use ($churchMap) {
            $cId = (int) ($song['church_id'] ?? 0);
            $song['church_name'] = ($cId !== 0) ? ($churchMap[$cId] ?? 'Unknown') : null;
            return $song;
        }, $songs);

        Response::json(['success' => true, 'songs' => $enrichedSongs]);
    }

    private function show($id)
    {
        $song = \App\Repositories\SongRepo::findById($id);
        if ($song) {
            Response::json(['success' => true, 'song' => $song]);
        } else {
            Response::error("Song not found", 404);
        }
    }

    private function listEdits($memberId)
    {
        $edits = \App\Repositories\SongRepo::listPendingEdits();
        Response::json(['success' => true, 'edits' => $edits]);
    }

    private function proposeEdit($memberId, $input = [])
    {
        $songId = $input['song_id'] ?? null;
        $data = $input['data'] ?? null;

        if (!$songId || !$data) {
            return Response::error("Song ID and proposed data required");
        }

        $success = \App\Repositories\SongRepo::proposeEdit($songId, $memberId, $data);
        Response::json(['success' => $success, 'message' => $success ? 'Edición propuesta' : 'Error al proponer edición']);
    }

    private function resolveEdit($memberId, $input = [])
    {
        $editId = $input['id'] ?? null;
        $status = $input['status'] ?? null; // 'approved' or 'rejected'

        if (!$editId || !in_array($status, ['approved', 'rejected'])) {
            return Response::error("Edit ID and valid status required");
        }

        $success = \App\Repositories\SongRepo::resolveEdit($editId, $status);

        if ($success) {
            // Log activity
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            \App\Repositories\ActivityRepo::log(
                $member['church_id'],
                $memberId,
                $status === 'approved' ? 'approved' : 'rejected',
                'song',
                $editId,
                ['name' => 'edición de canción']
            );
        }

        Response::json(['success' => $success, 'message' => "Edición " . ($status === 'approved' ? 'aprobada' : 'rechazada')]);
    }

    private function update($id, $input = [])
    {
        if (!$id || !is_numeric($id)) {
            return Response::error("Invalid Song ID");
        }

        $success = \App\Repositories\SongRepo::update($id, $input);
        Response::json(['success' => $success, 'message' => $success ? 'Song updated' : 'Failed to update song']);
    }

    private function create($memberId, $churchId = null, $input = [])
    {
        // Safety: If no churchId is passed or it's 0 (General), 
        // we check the member's native church to make it private to them by default.
        if (!$churchId || (int)$churchId === 0) {
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? 0;
        }

        if (!isset($input['title']) || !isset($input['artist'])) {
            return Response::error("Title and Artist are required");
        }

        $id = \App\Repositories\SongRepo::add([
            'church_id' => $churchId,
            'title' => $input['title'],
            'artist' => $input['artist'],
            'original_key' => $input['original_key'] ?? '',
            'tempo' => $input['tempo'] ?? '',
            'time_signature' => $input['time_signature'] ?? '4/4',
            'bpm_type' => $input['bpm_type'] ?? 'fast',
            'content' => $input['content'] ?? '',
            'category' => $input['category'] ?? '',
            'youtube_url' => $input['youtube_url'] ?? '',
            'spotify_url' => $input['spotify_url'] ?? ''
        ]);

        if ($id) {
            Response::json(['success' => true, 'id' => $id, 'message' => 'Song created']);
        } else {
            Response::error("Failed to create song");
        }
    }
}
