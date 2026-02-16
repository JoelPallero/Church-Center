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
 * SMART PATH DISCOVERY
 */
$possiblePaths = [
    __DIR__ . '/../../backend/src/Auth.php',
    __DIR__ . '/../../msm_logic/src/Auth.php',
    __DIR__ . '/../../../msm_logic/src/Auth.php'
];

$basePath = null;
foreach ($possiblePaths as $p) {
    if (file_exists($p)) {
        $basePath = dirname($p) . '/';
        break;
    }
}

if (!$basePath) {
    http_response_code(500);
    echo json_encode(["message" => "Critical Error: Core logic not found."]);
    exit();
}

require_once $basePath . 'SongManager.php';
require_once $basePath . 'Auth.php';

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

$user = $auth->validateJWT($token);
if (!$user) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized. Invalid Token."]);
    exit();
}

$userRole = strtolower($user['role'] ?? '');
$isMaster = ($userRole === 'master');
$churchId = $isMaster ? null : ($user['cid'] ?? null);
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET' && !isset($_GET['id'])) {
        $query = $_GET['q'] ?? '';
        Debug::log("API_SONG_SEARCH | Role: $userRole | IsMaster: " . ($isMaster ? 'YES' : 'NO') . " | CID: " . ($churchId ?? 'NULL') . " | Q: $query");

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
        $data = json_decode(file_get_contents("php://input"), true);
        Debug::log("API_SONG_CREATE_REQ | User: {$user['mid']} | Level: " . ($user['level'] ?? '??'));

        // level <= 30 for direct create
        if (!isset($user['level']) || $user['level'] > 30) {
            http_response_code(403);
            Debug::security("FORBIDDEN_SONG_CREATE | ReqBy: {$user['mid']} | Level: " . ($user['level'] ?? '??'));
            echo json_encode(["message" => "Forbidden. Only leaders can create songs."]);
            exit();
        }
        $data['church_id'] = $churchId;
        $data['created_by'] = $user['mid'];
        $newId = $songManager->createSong($data);
        http_response_code(201);
        echo json_encode(["id" => $newId, "message" => "Song created."]);
    } elseif ($method === 'PUT' && isset($_GET['id'])) {
        $id = (int) $_GET['id'];
        $data = json_decode(file_get_contents("php://input"), true);

        // level <= 30 for direct update
        if (!isset($user['level']) || $user['level'] > 30) {
            http_response_code(403);
            Debug::security("FORBIDDEN_SONG_UPDATE | ReqBy: {$user['mid']} | Level: " . ($user['level'] ?? '??'));
            echo json_encode(["message" => "Forbidden. Only leaders can update songs directly."]);
            exit();
        }

        if ($songManager->updateSong($id, $churchId, $data)) {
            echo json_encode(["message" => "Song updated."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to update song."]);
        }
    } elseif ($method === 'DELETE' && isset($_GET['id'])) {
        $id = (int) $_GET['id'];
        // level <= 30 for delete
        if (!isset($user['level']) || $user['level'] > 30) {
            http_response_code(403);
            Debug::security("FORBIDDEN_SONG_DELETE | ReqBy: {$user['mid']} | Level: " . ($user['level'] ?? '??'));
            echo json_encode(["message" => "Forbidden."]);
            exit();
        }

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