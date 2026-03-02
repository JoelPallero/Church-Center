<?php

namespace App\Controllers;

use App\Middleware\PermissionMiddleware;
use App\Helpers\Response;

class SongController
{
    public function handle($memberId, $action, $method)
    {
        if ($method === 'GET') {
            if ($action === 'edits') {
                PermissionMiddleware::require($memberId, 'song.approve');
                $this->listEdits($memberId);
            } elseif (is_numeric($action)) {
                PermissionMiddleware::require($memberId, 'song.read');
                $this->show($action);
            } else {
                PermissionMiddleware::require($memberId, 'song.read');
                $this->list($memberId);
            }
        } elseif ($method === 'POST') {
            if ($action === 'propose_edit') {
                $this->proposeEdit($memberId);
            } elseif ($action === 'resolve_edit') {
                PermissionMiddleware::require($memberId, 'song.approve');
                $this->resolveEdit($memberId);
            } else {
                PermissionMiddleware::require($memberId, 'song.create');
                $this->create($memberId);
            }
        } elseif ($method === 'DELETE') {
            if (is_numeric($action)) {
                PermissionMiddleware::require($memberId, 'song.delete');
                $this->delete((int) $action);
            }
        }
    }

    private function delete($id)
    {
        $success = \App\Repositories\SongRepo::delete($id);
        Response::json(['success' => $success, 'message' => $success ? 'Song deleted' : 'Failed to delete song']);
    }

    private function list($memberId)
    {
        $churchId = $_GET['church_id'] ?? null;
        $isSuperAdmin = \App\Repositories\PermissionRepo::isSuperAdmin($memberId);

        // If not super admin and no church_id specified, we find the user's current church
        if (!$isSuperAdmin && $churchId === null) {
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? null;
        }

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

    private function proposeEdit($memberId)
    {
        $input = json_decode(file_get_contents('php://input'), true);
        $songId = $input['song_id'] ?? null;
        $data = $input['data'] ?? null;

        if (!$songId || !$data) {
            return Response::error("Song ID and proposed data required");
        }

        $success = \App\Repositories\SongRepo::proposeEdit($songId, $memberId, $data);
        Response::json(['success' => $success, 'message' => $success ? 'Edición propuesta' : 'Error al proponer edición']);
    }

    private function resolveEdit($memberId)
    {
        $input = json_decode(file_get_contents('php://input'), true);
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

    private function create($memberId)
    {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['title']) || !isset($input['artist'])) {
            return Response::error("Title and Artist are required");
        }

        $id = \App\Repositories\SongRepo::add([
            'church_id' => $_GET['church_id'] ?? 0,
            'title' => $input['title'],
            'artist' => $input['artist'],
            'original_key' => $input['original_key'] ?? '',
            'tempo' => $input['tempo'] ?? '',
            'content' => $input['content'] ?? '',
            'category' => $input['category'] ?? ''
        ]);

        if ($id) {
            Response::json(['success' => true, 'id' => $id, 'message' => 'Song created']);
        } else {
            Response::error("Failed to create song");
        }
    }
}
