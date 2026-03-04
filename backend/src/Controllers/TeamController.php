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

        if ($method === 'GET') {
            \App\Middleware\PermissionMiddleware::require($memberId, 'team.read', $churchId);
            if ($id && $subAction === 'members') {
                $this->listMembers($id);
            } else {
                $this->list($memberId, $churchId);
            }
        } elseif ($method === 'POST') {
            \App\Middleware\PermissionMiddleware::require($memberId, 'team.create', $churchId);

            if ($id && $subAction === 'members') {
                if (($parts[2] ?? '') === 'bulk') {
                    $this->assignBulk($id, $data);
                } else {
                    $this->assign($id, $data);
                }
            } elseif ($id && $subAction === 'join') {
                $this->join($memberId, $id);
            } else {
                $this->create($memberId, $churchId, $data);
            }
        } elseif ($method === 'PUT') {
            \App\Middleware\PermissionMiddleware::require($memberId, 'team.update', $churchId);
            if ($id) {
                $this->update($memberId, $id, $data);
            }
        } elseif ($method === 'DELETE') {
            \App\Middleware\PermissionMiddleware::require($memberId, 'team.update', $churchId);
            if ($id) {
                $this->delete($id);
            }
        }
    }

    private function list($memberId, $churchId = null)
    {
        $areaId = $_GET['areaId'] ?? $_GET['area_id'] ?? null;

        if (!$churchId) {
            $churchId = $_GET['churchId'] ?? $_GET['church_id'] ?? null;
        }

        if (!$churchId) {
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? null;
        }

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

    private function create($memberId, $churchId = null, $data = [])
    {
        $name = $data['name'] ?? null;
        if (!$churchId) {
            $churchId = $data['churchId'] ?? $data['church_id'] ?? $_GET['church_id'] ?? null;
        }
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

    private function assign($groupId, $data = [])
    {
        $memberId = $data['memberId'] ?? null;
        $role = $data['roleInGroup'] ?? 'member';

        if (!$memberId)
            Response::error("Member ID required", 400);

        $success = TeamRepo::assignMember($groupId, $memberId, $role);
        Response::json(['success' => $success]);
    }

    private function assignBulk($groupId, $data = [])
    {
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

    private function update($memberId, $groupId, $data = [])
    {

        // 1. Update basic info (name, description)
        $success = TeamRepo::update($groupId, $data);

        // 2. Update leader if provided
        if (isset($data['leaderId'])) {
            TeamRepo::setLeader($groupId, $data['leaderId']);
        }

        Response::json(['success' => $success, 'message' => $success ? 'Team updated' : 'Error updating team']);
    }
}
