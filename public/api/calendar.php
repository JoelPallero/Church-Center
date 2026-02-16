<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../backend/src/Auth.php';
require_once __DIR__ . '/../../backend/src/CalendarManager.php';

$auth = new Auth();
$calendar = new CalendarManager();

// Auth check
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

$churchId = $payload['cid'];
$userId = $payload['id'];
$role = $payload['role'];

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    if ($method === 'GET') {
        if ($action === 'list') {
            $start = $_GET['start'] ?? date('Y-m-d');
            $end = $_GET['end'] ?? date('Y-m-d', strtotime('+30 days'));
            $instances = $calendar->getInstances($churchId, $start, $end);
            echo json_encode(["success" => true, "instances" => $instances]);
        } elseif ($action === 'details') {
            $id = $_GET['id'] ?? 0;
            $details = $calendar->getInstanceDetails($id);
            if ($details && $details['church_id'] == $churchId) {
                echo json_encode(["success" => true, "details" => $details]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Not found"]);
            }
        } elseif ($action === 'assignment_data') {
            $members = $calendar->getMembers($churchId);
            $instruments = $calendar->getInstruments();
            $playlists = $calendar->getPlaylists($churchId);
            echo json_encode([
                "success" => true,
                "members" => $members,
                "instruments" => $instruments,
                "playlists" => $playlists
            ]);
        }
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);

        if ($action === 'create_meeting') {
            if (!in_array($role, ['pastor', 'master'])) {
                http_response_code(403);
                echo json_encode(["message" => "Only Pastors or Masters can create meetings."]);
                exit();
            }
            $input['church_id'] = $churchId;
            $input['created_by'] = $userId;
            $id = $calendar->createMeeting($input);
            echo json_encode(["success" => true, "id" => $id]);
        } elseif ($action === 'assign_team') {
            if (!in_array($role, ['pastor', 'master', 'leader'])) {
                http_response_code(403);
                echo json_encode(["message" => "Forbidden."]);
                exit();
            }
            $input['church_id'] = $churchId;
            $calendar->assignTeamMember($input);
            echo json_encode(["success" => true]);
        } elseif ($action === 'assign_setlist') {
            if (!in_array($role, ['pastor', 'master', 'leader'])) {
                http_response_code(403);
                echo json_encode(["message" => "Forbidden."]);
                exit();
            }
            $input['church_id'] = $churchId;
            $input['assigned_by'] = $userId;
            $calendar->assignSetlist($input);
            echo json_encode(["success" => true]);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
