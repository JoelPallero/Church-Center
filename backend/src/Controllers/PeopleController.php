<?php

namespace App\Controllers;

use App\Middleware\PermissionMiddleware;
use App\Helpers\Response;
use App\Helpers\Logger;

class PeopleController
{
    public function handle($memberId, $action, $method)
    {
        $churchId = $_GET['church_id'] ?? $_GET['churchId'] ?? null;
        $data = [];
        if ($method === 'POST' || $method === 'PUT' || $method === 'DELETE') {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true) ?? [];
            if (!$churchId) {
                $churchId = $data['churchId'] ?? $data['church_id'] ?? null;
            }
        }

        // If churchId is not provided or is 0, and user is not superadmin, 
        // we use their own church for context.
        $isSuperAdmin = \App\Repositories\PermissionRepo::isSuperAdmin($memberId);
        if (!$isSuperAdmin && ($churchId === null || (int) $churchId === 0)) {
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? null;
        }

        // Inject churchId back into data so called methods can see it
        if ($churchId && !isset($data['church_id'])) {
            $data['church_id'] = $churchId;
        }
        if ($churchId && !isset($data['churchId'])) {
            $data['churchId'] = $churchId;
        }

        if ($method === 'POST') {
            if ($action === 'invite') {
                PermissionMiddleware::require($memberId, 'users.invite', $churchId);
                $this->invite($memberId, $data);
                return;
            }

            if ($action === 'invite/bulk') {
                PermissionMiddleware::require($memberId, 'users.invite', $churchId);
                $this->bulkInvite($memberId, $data);
                return;
            }

            if ($action === 'approve') {
                PermissionMiddleware::require($memberId, 'users.approve', $churchId);
                $this->approve($memberId, $data);
                return;
            }
        } elseif ($method === 'PUT') {
            $pathParts = explode('/', $action);
            $targetId = is_numeric($pathParts[0]) ? (int) $pathParts[0] : null;
            $subAction = $pathParts[1] ?? '';

            if ($targetId) {
                if ($subAction === 'role') {
                    PermissionMiddleware::require($memberId, 'users.approve');
                    $this->updateRole($targetId, $data);
                } elseif ($subAction === 'status') {
                    PermissionMiddleware::require($memberId, 'users.approve');
                    $this->updateStatus($targetId, $data);
                } elseif ($subAction === 'profile') {
                    $this->updateProfile($memberId, $targetId, $data);
                }
                return;
            }
        } elseif ($method === 'DELETE') {
            if ($action === 'invite') {
                PermissionMiddleware::require($memberId, 'users.invite');
                $this->deleteInvitation($data);
                return;
            }
            if (is_numeric($action)) {
                PermissionMiddleware::require($memberId, 'users.delete');
                $this->deleteMember((int) $action);
                return;
            }
        }

        if ($method === 'GET') {
            PermissionMiddleware::require($memberId, 'church.update', $churchId);

            $pathParts = explode('/', $action);
            $targetId = is_numeric($pathParts[0]) ? (int) $pathParts[0] : null;
            $subAction = $pathParts[1] ?? '';

            if ($targetId) {
                if ($subAction === 'areas') {
                    $areas = \App\Repositories\UserRepo::getUserAreas($targetId);
                    Response::json(['success' => true, 'areaIds' => array_map(fn($a) => $a['id'], $areas)]);
                } elseif ($subAction === 'groups') {
                    $db = \App\Database::getInstance();
                    $stmt = $db->prepare("SELECT group_id FROM group_members WHERE member_id = ?");
                    $stmt->execute([$targetId]);
                    Response::json(['success' => true, 'groupIds' => $stmt->fetchAll(\PDO::FETCH_COLUMN)]);
                } else {
                    $user = \App\Repositories\UserRepo::getMemberData($targetId);
                    Response::json(['success' => true, 'user' => $user]);
                }
                return;
            }

            // churchId is already defined at line 62
            $users = \App\Repositories\UserRepo::getAllWithChurch($churchId);

            Response::json(['success' => true, 'users' => $users]);
        }
    }

    private function bulkInvite($memberId, $data = [])
    {
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
            $rawToken = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $rawToken);
            $expiresAt = date('Y-m-d H:i:s', strtotime('+48 hours'));

            $newId = \App\Repositories\UserRepo::createMember([
                'name' => ucfirst($name),
                'email' => $email,
                'church_id' => $churchId,
                'status' => 'pending',
                'invite_token' => $tokenHash,
                'token_expires_at' => $expiresAt
            ]);

            if ($newId) {
                \App\Repositories\UserRepo::assignRole($newId, $churchId, 5, 'mainhub'); // 5 = Member
                $success++;
                \App\Repositories\ActivityRepo::log($churchId, $memberId, 'invited', 'member', $newId, ['name' => $name]);

                // Send email
                $church = \App\Repositories\ChurchRepo::findById($churchId);
                \App\Helpers\MailHelper::sendInvitation($email, ucfirst($name), 'Miembro', "Church Center - " . ($church['name'] ?? 'Tu Iglesia'), $churchId, $rawToken);
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

    public function invite($memberId, $data = [])
    {
        Logger::info("PeopleController::invite called by admin ID: $memberId");
        $email = $data['email'] ?? '';
        $name = $data['name'] ?? '';
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

            $rawToken = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $rawToken);
            $expiresAt = date('Y-m-d H:i:s', strtotime('+48 hours'));

            $newMemberId = \App\Repositories\UserRepo::createMember([
                'name' => $name,
                'email' => $email,
                'church_id' => $churchId,
                'status' => 'pending',
                'invite_token' => $tokenHash,
                'token_expires_at' => $expiresAt
            ]);

            if ($newMemberId) {
                $roleName = 'Miembro';
                if ($roleId) {
                    \App\Repositories\UserRepo::assignRole($newMemberId, $churchId, $roleId, 'mainhub');

                    // Fetch role display name for email
                    $stmt = $db->prepare("SELECT display_name FROM roles WHERE id = ?");
                    $stmt->execute([(int) $roleId]);
                    $roleRes = $stmt->fetch();
                    if ($roleRes)
                        $roleName = $roleRes['display_name'];
                }

                \App\Repositories\ActivityRepo::log($churchId, $memberId, 'invited', 'member', $newMemberId, ['name' => $name]);

                // Send email with RAW token
                $church = \App\Repositories\ChurchRepo::findById($churchId);
                \App\Helpers\MailHelper::sendInvitation($email, $name, $roleName, "Church Center - " . ($church['name'] ?? 'Tu Iglesia'), $churchId, $rawToken);

                Response::json(['success' => true, 'message' => 'Member invited successfully', 'id' => $newMemberId]);
            } else {
                Response::error("Failed to create member record", 500);
            }
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("PeopleController::invite error: " . $e->getMessage());
            Response::error("Error al invitar al integrante. Intente nuevamente.", 500);
        }
    }

    private function approve($memberId, $data = [])
    {
        $pathParts = explode('/', $_GET['action'] ?? '');
        $targetMemberId = (int) ($pathParts[0] ?? 0);

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
        \App\Repositories\UserRepo::assignRole($targetMemberId, $member['church_id'], $roleId, 'mainhub');

        \App\Repositories\ActivityRepo::log($member['church_id'], $memberId, 'approved', 'member', $targetMemberId, ['name' => $member['name']]);

        Response::json(['success' => true, 'message' => 'Member approved successfully']);
    }

    private function updateRole($targetId, $data = [])
    {
        $roleId = $data['roleId'] ?? $data['role_id'] ?? null;
        if (!$roleId)
            Response::error("Role ID required", 400);

        $success = \App\Repositories\UserRepo::updateMemberRole($targetId, $roleId);
        Response::json(['success' => $success]);
    }

    private function updateStatus($targetId, $data = [])
    {
        $statusId = $data['statusId'] ?? $data['status_id'] ?? null;
        if (!$statusId)
            Response::error("Status ID required", 400);

        $statusMap = [1 => 'active', 2 => 'inactive', 3 => 'pending'];
        $statusStr = $statusMap[$statusId] ?? 'inactive';

        $success = \App\Repositories\UserRepo::updateStatus($targetId, $statusStr);
        Response::json(['success' => $success]);
    }

    private function updateProfile($memberId, $targetId, $data = [])
    {
        // Security: only self or admin
        $isSuper = \App\Repositories\PermissionRepo::isSuperAdmin($memberId);
        if (!$isSuper && $memberId != $targetId) {
            Response::error("Unauthorized", 403);
        }

        $success = \App\Repositories\UserRepo::updateProfile($targetId, $data);
        Response::json(['success' => $success]);
    }

    private function deleteInvitation($data = [])
    {
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
