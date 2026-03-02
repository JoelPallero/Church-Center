<?php

namespace App\Controllers;

use App\Repositories\TeamRepo;
use App\Helpers\Response;

class TeamController
{
    public function handle($memberId, $action, $method)
    {
        $parts = explode('/', $action);
        $id = is_numeric($parts[0]) ? (int) $parts[0] : null;
        $subAction = $parts[1] ?? '';

        if ($method === 'GET') {
            if ($id && $subAction === 'members') {
                $this->listMembers($id);
            } else {
                $this->list($memberId);
            }
        } elseif ($method === 'POST') {
            if ($id && $subAction === 'members') {
                if (($parts[2] ?? '') === 'bulk') {
                    $this->assignBulk($id);
                } else {
                    $this->assign($id);
                }
            } elseif ($id && $subAction === 'join') {
                $this->join($memberId, $id);
            } else {
                $this->create($memberId);
            }
        } elseif ($method === 'PUT') {
            if ($id) {
                $this->update($memberId, $id);
            }
        } elseif ($method === 'DELETE') {
            if ($id) {
                $this->delete($id);
            }
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

    private function listMembers($groupId)
    {
        $members = TeamRepo::getTeamMembers($groupId);
        Response::json(['success' => true, 'users' => $members]);
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

        if ($teamId && !empty($data['leaderId'])) {
            TeamRepo::assignMember($teamId, $data['leaderId'], 'leader');
        }
        if ($teamId) {
            \App\Repositories\ActivityRepo::log($churchId, $memberId, 'created', 'team', $teamId, ['name' => $data['name']]);
            Response::json(['success' => true, 'message' => 'Team created', 'id' => $teamId]);
        } else {
            Response::json(['success' => false, 'message' => 'Failed to create team']);
        }
    }

    private function assign($groupId)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $memberId = $data['memberId'] ?? null;
        $role = $data['roleInGroup'] ?? 'member';

        if (!$memberId)
            Response::error("Member ID required", 400);

        $success = TeamRepo::assignMember($groupId, $memberId, $role);
        Response::json(['success' => $success]);
    }

    private function assignBulk($groupId)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $memberIds = $data['memberIds'] ?? [];

        $success = TeamRepo::assignMembersBulk($groupId, $memberIds);
        Response::json(['success' => $success]);
    }

    private function join($memberId, $groupId)
    {
        $success = TeamRepo::assignMember($groupId, $memberId, 'member');
        Response::json(['success' => $success]);
    }

    private function delete($groupId)
    {
        $success = TeamRepo::delete($groupId);
        Response::json(['success' => $success]);
    }

    private function update($memberId, $groupId)
    {
        $data = json_decode(file_get_contents('php://input'), true);

        // 1. Update basic info (name, description)
        $success = TeamRepo::update($groupId, $data);

        // 2. Update leader if provided
        if (isset($data['leaderId'])) {
            TeamRepo::setLeader($groupId, $data['leaderId']);
        }

        Response::json(['success' => $success, 'message' => $success ? 'Team updated' : 'Error updating team']);
    }
}
