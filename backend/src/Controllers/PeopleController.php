<?php

namespace App\Controllers;

use App\Middleware\PermissionMiddleware;
use App\Helpers\Response;

class PeopleController
{
    public function handle($memberId, $action, $method)
    {
        if ($method === 'POST') {
            if ($action === 'invite') {
                PermissionMiddleware::require($memberId, 'users.invite');
                $this->invite($memberId);
                return;
            }

            if ($action === 'invite/bulk') {
                PermissionMiddleware::require($memberId, 'users.invite');
                $this->bulkInvite($memberId);
                return;
            }

            if ($action === 'approve') {
                PermissionMiddleware::require($memberId, 'users.approve');
                $this->approve($memberId);
                return;
            }
        }

        PermissionMiddleware::require($memberId, 'church.read');

        $churchId = $_GET['church_id'] ?? null;
        $users = \App\Repositories\UserRepo::getAllWithChurch($churchId);

        Response::json(['success' => true, 'users' => $users]);
    }

    private function bulkInvite($memberId)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $emails = $data['emails'] ?? [];
        $churchId = $data['churchId'] ?? $data['church_id'] ?? null;

        if (empty($emails) || !$churchId) {
            \App\Helpers\Logger::warning("PeopleController::inviteBulk validation failed: Emails or ChurchID missing. ChurchID: " . ($churchId ?? 'NULL'));
            Response::error("Emails and church ID are required", 400);
        }

        $success = 0;
        $failed = 0;

        foreach ($emails as $email) {
            // Basic validation
            if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $failed++;
                continue;
            }

            // Check if already exists
            $db = \App\Database::getInstance();
            $stmt = $db->prepare("SELECT id FROM member WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                $failed++;
                continue;
            }

            $name = explode('@', $email)[0];
            $newId = \App\Repositories\UserRepo::createMember([
                'name' => ucfirst($name),
                'email' => $email,
                'church_id' => $churchId,
                'status' => 'pending'
            ]);

            if ($newId) {
                \App\Repositories\UserRepo::assignRole($newId, $churchId, 4, 'church_center'); // 4 = Member
                $success++;
                \App\Repositories\ActivityRepo::log($churchId, $memberId, 'invited', 'member', $newId, ['name' => $name]);
            } else {
                $failed++;
            }
        }

        Response::json([
            'success' => $success,
            'failed' => $failed,
            'message' => "Process completed: $success successful, $failed failed"
        ]);
    }

    private function invite($memberId)
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $name = $data['name'] ?? null;
        $email = $data['email'] ?? null;
        $roleId = $data['roleId'] ?? $data['role_id'] ?? null;
        $churchId = $data['churchId'] ?? $data['church_id'] ?? null;

        if (!$name || !$email || !$churchId) {
            \App\Helpers\Logger::warning("PeopleController::invite - Missing data: " . json_encode(['name' => $name, 'email' => $email, 'church_id' => $churchId]));
            Response::error("Name, email and church ID are required", 400);
        }

        try {
            // Check if already exists
            $db = \App\Database::getInstance();
            $stmt = $db->prepare("SELECT id FROM member WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                Response::error("Member already exists with this email", 400);
            }

            $newMemberId = \App\Repositories\UserRepo::createMember([
                'name' => $name,
                'email' => $email,
                'church_id' => $churchId,
                'status' => 'pending'
            ]);

            if ($newMemberId) {
                if ($roleId) {
                    \App\Repositories\UserRepo::assignRole($newMemberId, $churchId, $roleId, 'church_center');
                }
                \App\Repositories\ActivityRepo::log($churchId, $memberId, 'invited', 'member', $newMemberId, ['name' => $name]);
                Response::json(['success' => true, 'message' => 'Member invited successfully', 'id' => $newMemberId]);
            } else {
                Response::error("Failed to create member record", 500);
            }
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("PeopleController::invite error: " . $e->getMessage());
            Response::error("Failed to invite member: " . $e->getMessage(), 500);
        }
    }

    private function approve($memberId)
    {
        $pathParts = explode('/', $_GET['action'] ?? '');
        $targetMemberId = (int) ($pathParts[0] ?? 0);

        $data = json_decode(file_get_contents('php://input'), true);
        $roleId = $data['roleId'] ?? $data['role_id'] ?? null;

        if (!$targetMemberId || !$roleId) {
            Response::error("Member ID and Role ID are required", 400);
        }

        $member = \App\Repositories\UserRepo::getMemberData($targetMemberId);
        if (!$member) {
            Response::error("Member not found", 404);
        }

        // 1. Update status to active and set role
        \App\Repositories\UserRepo::updateStatus($targetMemberId, 'active');
        \App\Repositories\UserRepo::updateMemberRole($targetMemberId, $roleId);

        // 2. Assign service role for Church Center
        \App\Repositories\UserRepo::assignRole($targetMemberId, $member['church_id'], $roleId, 'church_center');

        \App\Repositories\ActivityRepo::log($member['church_id'], $memberId, 'approved', 'member', $targetMemberId, ['name' => $member['name']]);

        Response::json(['success' => true, 'message' => 'Member approved successfully']);
    }
}
