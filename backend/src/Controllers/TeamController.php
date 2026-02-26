<?php

namespace App\Controllers;

use App\Repositories\TeamRepo;
use App\Helpers\Response;

class TeamController
{
    public function handle($memberId, $action, $method)
    {
        if ($method === 'GET') {
            $this->list($memberId);
        } elseif ($method === 'POST') {
            $this->create($memberId);
        }
    }

    private function list($memberId)
    {
        $churchId = $_GET['churchId'] ?? $_GET['church_id'] ?? null;
        $areaId = $_GET['areaId'] ?? $_GET['area_id'] ?? null;

        if (!$churchId) {
            Response::error("Church ID required", 400);
        }

        $teams = TeamRepo::getByChurch($churchId, $areaId);
        Response::json(['success' => true, 'groups' => $teams]);
    }

    private function create($memberId)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $name = $data['name'] ?? null;
        $churchId = $data['churchId'] ?? $data['church_id'] ?? $_GET['church_id'] ?? null;
        $areaId = $data['areaId'] ?? $data['area_id'] ?? null;

        if (!$name || !$churchId) {
            Response::error("Name and Church ID required", 400);
        }

        $teamId = TeamRepo::create($churchId, $areaId, $name, $data['description'] ?? '');

        if ($teamId && isset($data['leaderId'])) {
            TeamRepo::assignMember($teamId, $data['leaderId'], 'leader');
        }
        if ($teamId) {
            \App\Repositories\ActivityRepo::log($churchId, $memberId, 'created', 'team', $teamId, ['name' => $data['name']]);
            Response::json(['success' => true, 'message' => 'Team created', 'id' => $teamId]);
        } else {
            Response::json(['success' => false, 'message' => 'Failed to create team']);
        }
    }
}
