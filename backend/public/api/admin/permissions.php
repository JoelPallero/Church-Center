<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * PATH DISCOVERY
 */
$possiblePaths = [
    __DIR__ . '/../../../backend/src/Auth.php',
    __DIR__ . '/../../../../backend/src/Auth.php'
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
$auth = new Auth();

// Helper to get Bearer Token
function getBearerToken()
{
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

// Security Check
$token = getBearerToken();
if (!$token) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized. Token missing."]);
    exit();
}

$user = $auth->validateJWT($token);
if (!$user || $user['level'] > 0) { // Only Master (Level 0) can manage permissions
    http_response_code(403);
    echo json_encode(["message" => "Forbidden. Master access required."]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    if ($method === 'GET') {
        if ($action === 'roles') {
            echo json_encode($auth->getAllRoles());
        } elseif ($action === 'all_permissions') {
            echo json_encode($auth->getAllPermissions());
        } elseif ($action === 'role_permissions') {
            $roleId = $_GET['role_id'] ?? null;
            if (!$roleId)
                throw new Exception("Role ID required.");
            echo json_encode($auth->getPermissionsByRole($roleId));
        } else {
            throw new Exception("Invalid GET action.");
        }
    } elseif ($method === 'POST') {
        if ($action === 'update') {
            $data = json_decode(file_get_contents("php://input"), true);
            $roleId = $data['role_id'] ?? null;
            $permissionIds = $data['permission_ids'] ?? [];

            if (!$roleId)
                throw new Exception("Role ID required.");

            if ($auth->updateRolePermissions($roleId, $permissionIds)) {
                echo json_encode(["success" => true, "message" => "Permissions updated successfully."]);
            } else {
                throw new Exception("Failed to update permissions.");
            }
        } else {
            throw new Exception("Invalid POST action.");
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>