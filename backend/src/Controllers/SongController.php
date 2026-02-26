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
        }
    }

    private function list($memberId)
    {
        $songs = \App\Repositories\SongRepo::getAll();
        Response::json(['success' => true, 'songs' => $songs]);
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
