<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * SMART BOOTSTRAPPER
 */
$bootstrapPaths = [
    __DIR__ . '/../../src/bootstrap.php',
    __DIR__ . '/../../../msm_logic/src/bootstrap.php',
    __DIR__ . '/../../../../msm_logic/src/bootstrap.php'
];

foreach ($bootstrapPaths as $p) {
    if (file_exists($p)) {
        require_once $p;
        break;
    }
}

if (!class_exists('Bootstrapper')) {
    http_response_code(500);
    echo json_encode(["message" => "Critical Error: Bootstrapper not found."]);
    exit();
}

Bootstrapper::require('modules/worship', 'SongManager');
Bootstrapper::require('core', 'Auth');
Bootstrapper::require('core', 'Debug');
Bootstrapper::require('Middleware', 'Authorization');

$auth = new Auth();
$songManager = new SongManager();

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

// Validate Token
$token = getBearerToken();
if (!$token) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized. Token missing."]);
    exit();
}

$userPayload = $auth->validateJWT($token);
if (!$userPayload) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized. Invalid Token."]);
    exit();
}

$authz = new Authorization($auth, $userPayload);

// 1. Basic Hub Access (Always required for any action in this file)
$authz->protect('worship');

// Use contextual info for manager logic
$churchId = $userPayload['cid'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET' && !isset($_GET['id'])) {
        $query = $_GET['q'] ?? '';
        // Check if user is Master (Special case: access to everything if coming from mainhub)
        $isMaster = (bool) ($auth->getUserServices($userPayload['mid'])['mainhub']['role'] === 'master' ?? false);

        Debug::log("API_SONG_SEARCH | User: {$userPayload['mid']} | CID: " . ($churchId ?? 'NULL') . " | Q: $query");

        $songs = $songManager->searchSongs($churchId, $query, $isMaster);
        Debug::log("API_SONG_SEARCH_RESULT | Count: " . count($songs));

        echo json_encode($songs);
    } elseif ($method === 'GET' && isset($_GET['id'])) {
        $id = (int) $_GET['id'];
        Debug::log("API_SONG_GET | ID: $id | CID: " . ($churchId ?? 'NULL'));
        $song = $songManager->getSong($id, $churchId);
        if ($song) {
            echo json_encode($song);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Song not found."]);
        }
    } elseif ($method === 'POST') {
        $authz->protect('worship', 'songs.create');
        $data = json_decode(file_get_contents("php://input"), true);

        $data['church_id'] = $churchId;
        $data['created_by'] = $userPayload['mid'];
        $newId = $songManager->createSong($data);
        http_response_code(201);
        echo json_encode(["id" => $newId, "message" => "Song created."]);
    } elseif ($method === 'PUT' && isset($_GET['id'])) {
        $authz->protect('worship', 'songs.edit');
        $id = (int) $_GET['id'];
        $data = json_decode(file_get_contents("php://input"), true);

        if ($songManager->updateSong($id, $churchId, $data)) {
            echo json_encode(["message" => "Song updated."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to update song."]);
        }
    } elseif ($method === 'DELETE' && isset($_GET['id'])) {
        $authz->protect('worship', 'songs.delete');
        $id = (int) $_GET['id'];

        if ($songManager->deleteSong($id, $churchId)) {
            echo json_encode(["message" => "Song deleted."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to delete song."]);
        }
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Resource not found."]);
    }
} catch (Exception $e) {
    Debug::error("API Songs Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["message" => "Ocurrió un error inesperado."]);
}
?>