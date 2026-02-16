<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * SMART PATH DISCOVERY
 */
$possiblePaths = [
    __DIR__ . '/../../backend/src/Auth.php',
    __DIR__ . '/../../msm_logic/src/Auth.php',
    __DIR__ . '/../../../msm_logic/src/Auth.php'
];

$logicPath = null;
foreach ($possiblePaths as $p) {
    if (file_exists($p)) {
        $logicPath = $p;
        break;
    }
}

if (!$logicPath) {
    http_response_code(500);
    echo json_encode(["message" => "Critical Error: Core logic not found."]);
    exit();
}

require_once $logicPath;
require_once str_replace('Auth.php', 'PeopleManager.php', $logicPath);

$auth = new Auth();
$people = new PeopleManager();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Check Auth
$token = null;
$headers = getallheaders();
if (isset($headers['Authorization'])) {
    if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
        $token = $matches[1];
    }
}

if (!$token) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized"]);
    exit();
}

$payload = $auth->validateJWT($token);
if (!$payload) {
    http_response_code(401);
    echo json_encode(["message" => "Invalid token"]);
    exit();
}

try {
    if ($method === 'GET' && $action === 'list') {
        Debug::log("API_PEOPLE_LIST | ReqBy: {$payload['mid']} | Role: {$payload['role']}");
        // Master and Pastor can list everyone
        if (!in_array($payload['role'], ['master', 'pastor'])) {
            // For now, restrict to master/pastor for simplicity
        }
        $users = $people->getAll();

        // Filter: Only Master can see other Master users
        if ($payload['role'] !== 'master') {
            $users = array_filter($users, function ($u) {
                return $u['role_name'] !== 'master';
            });
        }

        echo json_encode([
            "success" => true,
            "users" => array_values(array_map(function ($u) {
                return [
                    "id" => $u['id'],
                    "name" => $u['name'],
                    "email" => $u['email'],
                    "role" => [
                        "name" => $u['role_name'],
                        "display" => $u['role_display']
                    ],
                    "status" => $u['status'],
                    "has_account" => (bool) $u['has_account'],
                    "sex" => $u['sex'],
                    "areas" => $u['areas'] ?? []
                ];
            }, $users))
        ]);
    } elseif ($method === 'GET' && $action === 'team') {
        Debug::log("API_PEOPLE_TEAM | ReqBy: {$payload['mid']}");
        $users = $people->getMembersByGroupName($payload['cid'], 'Alabanza');
        echo json_encode([
            "success" => true,
            "users" => array_values(array_map(function ($u) {
                return [
                    "id" => $u['id'],
                    "name" => $u['name'],
                    "email" => $u['email'],
                    "role" => [
                        "name" => $u['role_name'],
                        "display" => $u['role_display']
                    ],
                    "status" => $u['status'],
                    "has_account" => (bool) $u['has_account'],
                    "sex" => $u['sex'],
                    "areas" => $u['areas'] ?? []
                ];
            }, $users))
        ]);
    } elseif ($method === 'GET' && $action === 'my_team_members') {
        Debug::log("API_PEOPLE_MY_TEAM | ReqBy: {$payload['mid']} | Role: {$payload['role']}");
        $users = $people->getMembersByLeaderId($payload['cid'], $payload['mid']);
        echo json_encode([
            "success" => true,
            "users" => array_values(array_map(function ($u) {
                return [
                    "id" => $u['id'],
                    "name" => $u['name'],
                    "email" => $u['email'],
                    "role" => [
                        "name" => $u['role_name'],
                        "display" => $u['role_display']
                    ],
                    "status" => $u['status'],
                    "group_name" => $u['group_name'],
                    "has_account" => (bool) $u['has_account'],
                    "sex" => $u['sex'],
                    "areas" => $u['areas'] ?? []
                ];
            }, $users))
        ]);
    } elseif ($method === 'POST' && $action === 'update_role') {
        if ($payload['role'] !== 'master') {
            http_response_code(403);
            Debug::security("FORBIDDEN_ROLE_CHANGE | ReqBy: {$payload['mid']}");
            echo json_encode(["message" => "Only Master can change roles."]);
            exit();
        }
        $data = json_decode(file_get_contents("php://input"));
        Debug::log("API_PEOPLE_ROLE_UPDATE | UserID: " . ($data->userId ?? '??') . " | RoleID: " . ($data->roleId ?? '??'));
        if ($data && isset($data->userId) && isset($data->roleId)) {
            $success = $people->updateRole($data->userId, $data->roleId);
            echo json_encode(["success" => $success]);
        }
    } elseif ($method === 'POST' && $action === 'invite') {
        // level <= 30: Master(0), Pastor(10), Leader(30)
        if (!isset($payload['level']) || $payload['level'] > 30) {
            http_response_code(403);
            Debug::security("FORBIDDEN_INVITE | ReqBy: {$payload['mid']} | Level: " . ($payload['level'] ?? '??'));
            echo json_encode(["message" => "Permission denied."]);
            exit();
        }
        $data = json_decode(file_get_contents("php://input"));
        if ($data && !empty($data->email) && !empty($data->name)) {
            $result = $people->invite($data->name, $data->email, $data->roleId ?? 5, $payload['cid']);
            echo json_encode($result);
        }
    } elseif ($method === 'POST' && $action === 'bulk_invite') {
        if (!isset($payload['level']) || $payload['level'] > 30) {
            http_response_code(403);
            echo json_encode(["message" => "Permission denied."]);
            exit();
        }
        $data = json_decode(file_get_contents("php://input"));
        if ($data && !empty($data->emails) && is_array($data->emails)) {
            $result = $people->inviteBulk($data->emails, $payload['cid']);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Invalid data. Emails array expected."]);
        }
    } elseif ($method === 'POST' && $action === 'resend_invite') {
        if (!isset($payload['level']) || $payload['level'] > 30) {
            http_response_code(403);
            echo json_encode(["message" => "Permission denied."]);
            exit();
        }
        $data = json_decode(file_get_contents("php://input"));
        if ($data && !empty($data->email)) {
            $result = $people->resendInvitation($data->email);
            echo json_encode($result);
        }
    } elseif ($method === 'POST' && $action === 'delete_invite') {
        if (!isset($payload['level']) || $payload['level'] > 30) {
            http_response_code(403);
            echo json_encode(["message" => "Permission denied."]);
            exit();
        }
        $data = json_decode(file_get_contents("php://input"));
        if ($data && !empty($data->email)) {
            $result = $people->deleteInvitation($data->email);
            echo json_encode($result);
        }
    } elseif ($method === 'GET' && $action === 'list_roles') {
        $roles = $people->getRoles();
        echo json_encode(["success" => true, "roles" => $roles]);
    } elseif ($method === 'GET' && $action === 'list_groups') {
        $groups = $people->getGroups($payload['cid']); // Get groups for the church
        echo json_encode(["success" => true, "groups" => $groups]);
    } elseif ($method === 'GET' && $action === 'list_group_members') {
        $groupId = $_GET['groupId'] ?? 0;
        $users = $people->getMembersByGroupId($payload['cid'], $groupId);
        echo json_encode(["success" => true, "users" => $users]);
    } elseif ($method === 'POST' && $action === 'join_group') {
        $data = json_decode(file_get_contents("php://input"));
        if ($data && !empty($data->groupId)) {
            $success = $people->joinGroup($payload['mid'], $data->groupId);
            echo json_encode(["success" => $success]);
        }
    } elseif ($method === 'POST' && $action === 'save_instruments') {
        $data = json_decode(file_get_contents("php://input"));
        if ($data && isset($data->instruments)) {
            $success = $people->saveInstruments($payload['mid'], $data->instruments);
            echo json_encode(["success" => $success]);
        }
    } elseif ($method === 'POST' && $action === 'approve_user') {
        if (!isset($payload['level']) || $payload['level'] > 30) {
            http_response_code(403);
            echo json_encode(["message" => "Permission denied."]);
            exit();
        }
        $data = json_decode(file_get_contents("php://input"));
        if ($data && !empty($data->memberId)) {
            $result = $people->approveUser($data->memberId, $data->roleId ?? 5, $payload['cid'], $data->groups ?? [], $data->areaIds ?? []);
            echo json_encode($result);
        }
    } elseif ($method === 'POST' && $action === 'update_member_profile') {
        // level <= 30 for admin actions
        if (!isset($payload['level']) || $payload['level'] > 30) {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden."]);
            exit();
        }
        $data = json_decode(file_get_contents("php://input"));
        if ($data && !empty($data->memberId)) {
            $result = $people->updateMemberProfile($data->memberId, $payload['cid'], (array) $data);
            echo json_encode($result);
        }
    } elseif ($method === 'GET' && $action === 'list_instruments') {
        $instruments = $people->getAllInstruments();
        echo json_encode(["success" => true, "instruments" => $instruments]);
    } elseif ($method === 'GET' && $action === 'list_areas') {
        $areas = $people->getAreas($payload['cid']);
        echo json_encode(["success" => true, "areas" => $areas]);
    } elseif ($method === 'POST' && $action === 'add_area') {
        if (!isset($payload['level']) || $payload['level'] > 30) {
            http_response_code(403);
            echo json_encode(["message" => "Permission denied."]);
            exit();
        }
        $data = json_decode(file_get_contents("php://input"));
        if ($data && !empty($data->name)) {
            $success = $people->addArea($payload['cid'], $data->name);
            echo json_encode(["success" => $success]);
        }
    } elseif ($method === 'POST' && $action === 'add_group') {
        if (!isset($payload['level']) || $payload['level'] > 30) {
            http_response_code(403);
            echo json_encode(["message" => "Permission denied."]);
            exit();
        }
        $data = json_decode(file_get_contents("php://input"));
        if ($data && !empty($data->name)) {
            $success = $people->addGroup($payload['cid'], $data->name, $data->leaderId ?? null, $data->areaId ?? null, $data->description ?? '', $data->isServiceTeam ?? true);
            echo json_encode(["success" => $success]);
        }
    } elseif ($method === 'POST' && $action === 'delete_group') {
        if (!isset($payload['level']) || $payload['level'] > 30) {
            http_response_code(403);
            echo json_encode(["message" => "Permission denied."]);
            exit();
        }
        $data = json_decode(file_get_contents("php://input"));
        if ($data && !empty($data->groupId)) {
            $success = $people->deleteGroup($payload['cid'], $data->groupId);
            echo json_encode(["success" => $success]);
        }
    } elseif ($method === 'POST' && $action === 'assign_team') {
        if (!isset($payload['level']) || $payload['level'] > 30) {
            http_response_code(403);
            echo json_encode(["message" => "Permission denied."]);
            exit();
        }
        $data = json_decode(file_get_contents("php://input"));
        if ($data && !empty($data->memberId) && !empty($data->teamId)) {
            $success = $people->assignMemberToTeam($data->memberId, $data->teamId, $data->roleInGroup ?? 'member', $payload['cid']);
            echo json_encode(["success" => $success]);
        }
    } elseif ($method === 'POST' && $action === 'update_status') {
        if (!isset($payload['level']) || $payload['level'] > 30) {
            http_response_code(403);
            echo json_encode(["message" => "Permission denied."]);
            exit();
        }
        $data = json_decode(file_get_contents("php://input"));
        if ($data && isset($data->userId) && isset($data->statusId)) {
            $success = $people->updateStatus($data->userId, $data->statusId);
            echo json_encode(["success" => $success]);
        }
    } elseif ($method === 'POST' && $action === 'delete_member') {
        if (!isset($payload['level']) || $payload['level'] > 10) { // Solo Pastor/Master
            http_response_code(403);
            echo json_encode(["message" => "Only administrators can delete members permanently."]);
            exit();
        }
        $data = json_decode(file_get_contents("php://input"));
        if ($data && !empty($data->memberId)) {
            $success = $people->deleteMember($data->memberId);
            echo json_encode(["success" => $success]);
        }
    } elseif ($method === 'GET' && $action === 'get_member_areas') {
        $memberId = $_GET['memberId'] ?? 0;
        $areas = $people->getMemberAreas($memberId);
        echo json_encode(["success" => true, "areaIds" => $areas]);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Action not found"]);
    }
} catch (Throwable $e) {
    Debug::error("API People Fatal Error: " . $e->getMessage() . " | Trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Ocurrió un error al procesar la solicitud. Por favor, intente más tarde.",
        "debug_info" => $e->getMessage() // Keeping for dev, but message is friendly
    ]);
}
?>