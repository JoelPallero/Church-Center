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
        } elseif ($method === 'PUT') {
            $pathParts = explode('/', $action);
            $targetId = is_numeric($pathParts[0]) ? (int) $pathParts[0] : null;
            $subAction = $pathParts[1] ?? '';

            if ($targetId) {
                if ($subAction === 'role') {
                    PermissionMiddleware::require($memberId, 'users.approve');
                    $this->updateRole($targetId);
                } elseif ($subAction === 'status') {
                    PermissionMiddleware::require($memberId, 'users.approve');
                    $this->updateStatus($targetId);
                } elseif ($subAction === 'profile') {
                    $this->updateProfile($memberId, $targetId);
                }
                return;
            }
        } elseif ($method === 'DELETE') {
            if ($action === 'invite') {
                PermissionMiddleware::require($memberId, 'users.invite');
                $this->deleteInvitation();
                return;
            }
            if (is_numeric($action)) {
                PermissionMiddleware::require($memberId, 'users.delete');
                $this->deleteMember((int) $action);
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
            $token = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+48 hours'));

            $newId = \App\Repositories\UserRepo::createMember([
                'name' => ucfirst($name),
                'email' => $email,
                'church_id' => $churchId,
                'status' => 'pending',
                'invite_token' => $token,
                'token_expires_at' => $expiresAt
            ]);

            if ($newId) {
                \App\Repositories\UserRepo::assignRole($newId, $churchId, 5, 'church_center'); // 5 = Member
                $success++;
                \App\Repositories\ActivityRepo::log($churchId, $memberId, 'invited', 'member', $newId, ['name' => $name]);

                // Send email
                $church = \App\Repositories\ChurchRepo::findById($churchId);
                \App\Helpers\MailHelper::sendInvitation($email, ucfirst($name), 'Miembro', $church['name'] ?? 'Tu Iglesia', $churchId, $token);
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

            $token = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+48 hours'));

            $newMemberId = \App\Repositories\UserRepo::createMember([
                'name' => $name,
                'email' => $email,
                'church_id' => $churchId,
                'status' => 'pending',
                'invite_token' => $token,
                'token_expires_at' => $expiresAt
            ]);

            if ($newMemberId) {
                $roleName = 'Miembro';
                if ($roleId) {
                    \App\Repositories\UserRepo::assignRole($newMemberId, $churchId, $roleId, 'church_center');

                    // Fetch role display name for email
                    $stmt = $db->prepare("SELECT display_name FROM roles WHERE id = ?");
                    $stmt->execute([(int) $roleId]);
                    $roleRes = $stmt->fetch();
                    if ($roleRes)
                        $roleName = $roleRes['display_name'];
                }

                \App\Repositories\ActivityRepo::log($churchId, $memberId, 'invited', 'member', $newMemberId, ['name' => $name]);

                // Send email
                $church = \App\Repositories\ChurchRepo::findById($churchId);
                \App\Helpers\MailHelper::sendInvitation($email, $name, $roleName, $church['name'] ?? 'Tu Iglesia', $churchId, $token);

                Response::json(['success' => true, 'message' => 'Member invited successfully', 'id' => $newMemberId]);
            } else {
                Response::error("Failed to create member record", 500);
            }
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("PeopleController::invite error: " . $e->getMessage());
            Response::error("Error al invitar al integrante. Intente nuevamente.", 500);
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

    private function updateRole($targetId)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $roleId = $data['roleId'] ?? $data['role_id'] ?? null;
        if (!$roleId)
            Response::error("Role ID required", 400);

        $success = \App\Repositories\UserRepo::updateMemberRole($targetId, $roleId);
        Response::json(['success' => $success]);
    }

    private function updateStatus($targetId)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $statusId = $data['statusId'] ?? $data['status_id'] ?? null;
        if (!$statusId)
            Response::error("Status ID required", 400);

        $statusMap = [1 => 'active', 2 => 'inactive', 3 => 'pending'];
        $statusStr = $statusMap[$statusId] ?? 'inactive';

        $success = \App\Repositories\UserRepo::updateStatus($targetId, $statusStr);
        Response::json(['success' => $success]);
    }

    private function updateProfile($memberId, $targetId)
    {
        // Security: only self or admin
        $isSuper = \App\Repositories\PermissionRepo::isSuperAdmin($memberId);
        if (!$isSuper && $memberId != $targetId) {
            Response::error("Unauthorized", 403);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $success = \App\Repositories\UserRepo::updateProfile($targetId, $data);
        Response::json(['success' => $success]);
    }

    private function deleteInvitation()
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $email = $data['email'] ?? null;
        if (!$email)
            Response::error("Email required", 400);

        $success = \App\Repositories\UserRepo::deleteInvitation($email);
        Response::json(['success' => $success]);
    }

    private function deleteMember($targetId)
    {
        $success = \App\Repositories\UserRepo::hardDelete($targetId);
        Response::json(['success' => $success]);
    }
}
