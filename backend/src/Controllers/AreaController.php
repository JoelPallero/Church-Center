<?php

namespace App\Controllers;

use App\Repositories\AreaRepo;
use App\Helpers\Response;
use PDO;

class AreaController
{
    public function handle($memberId, $action, $method)
    {
        if ($method === 'GET') {
            \App\Middleware\PermissionMiddleware::require($memberId, 'church.read');
            $this->list($memberId);
        } elseif ($method === 'POST') {
            \App\Middleware\PermissionMiddleware::require($memberId, 'area.create');
            $this->create($memberId);
        } elseif ($method === 'PUT') {
            \App\Middleware\PermissionMiddleware::require($memberId, 'area.create');
            $this->update($memberId, $action);
        } elseif ($method === 'DELETE') {
            \App\Middleware\PermissionMiddleware::require($memberId, 'area.create');
            $this->delete($memberId, $action);
        }
    }

    private function list($memberId)
    {
        $churchId = $_GET['churchId'] ?? $_GET['church_id'] ?? null;

        $isMaster = \App\Repositories\PermissionRepo::isSuperAdmin($memberId);

        if (!$churchId && !$isMaster) {
            Response::error("Church ID required", 400);
        }

        if ($churchId) {
            $areas = AreaRepo::getByChurch($churchId);
        } else {
            // If master and no church_id, get all (could add a Repo method for all, but for now we look for church context)
            $areas = \App\Database::getInstance()->query("SELECT a.*, c.name as church_name FROM areas a JOIN church c ON a.church_id = c.id WHERE c.is_active = 1")->fetchAll(PDO::FETCH_ASSOC);
        }

        Response::json(['success' => true, 'areas' => $areas]);
    }

    private function create($memberId)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $name = $data['name'] ?? null;
        $churchId = $_GET['church_id'] ?? $_GET['churchId'] ?? $data['churchId'] ?? $data['church_id'] ?? null;

        if (!$name || !$churchId) {
            Response::error("Name and Church ID required", 400);
        }

        $id = AreaRepo::create($churchId, $name);
        if ($id) {
            \App\Repositories\ActivityRepo::log($churchId, $memberId, 'created', 'area', $id, ['name' => $name]);
        }
        Response::json(['success' => !!$id, 'message' => $id ? 'Area created' : 'Error creating area']);
    }

    private function update($memberId, $id)
    {
        if (!$id || !is_numeric($id)) {
            Response::error("Invalid ID", 400);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $name = $data['name'] ?? null;

        if (!$name) {
            Response::error("Name is required", 400);
        }

        $success = AreaRepo::update($id, $name, $data['description'] ?? null);
        Response::json(['success' => $success, 'message' => $success ? 'Area updated' : 'Error updating area']);
    }

    private function delete($memberId, $id)
    {
        if (!$id || !is_numeric($id)) {
            Response::error("Invalid ID", 400);
        }

        $success = AreaRepo::delete($id);
        Response::json(['success' => $success, 'message' => $success ? 'Area deleted' : 'Error deleting area']);
    }
}
