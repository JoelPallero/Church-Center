<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../src/Auth.php';
require_once __DIR__ . '/../src/ChurchManager.php';
require_once __DIR__ . '/../src/PeopleManager.php';

$auth = new Auth();
$method = $_SERVER['REQUEST_METHOD'];

// VALIDACIÓN DE TOKEN Y ROL MASTER
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
if (!$payload || $payload['role'] !== 'master') {
    http_response_code(403);
    echo json_encode(["message" => "Permission denied. Master access only."]);
    exit();
}

$churchControl = new ChurchManager();
$peopleControl = new PeopleManager();

$action = $_GET['action'] ?? '';

try {
    if ($method === 'GET') {
        if ($action === 'churches') {
            echo json_encode($churchControl->getAll());
        } elseif ($action === 'stats') {
            // Stats básicas para el dashboard master
            $db = Database::getInstance();
            $conn = $db->getConnection();
            $musicConn = $db->getMusicConnection();

            // Status checks
            $mainStatus = $conn ? "online" : "offline";
            $musicStatus = $musicConn ? "online" : "offline";

            $churches = $conn ? $conn->query("SELECT COUNT(*) FROM church")->fetchColumn() : 0;
            $members = $conn ? $conn->query("SELECT COUNT(*) FROM member WHERE status_id = 1")->fetchColumn() : 0;

            // Songs are now counted in MusicCenter (Central Repository)
            $songs = $musicConn ? $musicConn->query("SELECT COUNT(*) FROM songs")->fetchColumn() : 0;

            echo json_encode([
                "churches" => $churches,
                "members" => $members,
                "songs" => $songs,
                "reunions" => 0, // A implementar
                "db_status" => [
                    "main" => $mainStatus,
                    "music" => $musicStatus
                ]
            ]);
        }
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"));
        if ($action === 'create_church') {
            if (empty($data->name) || empty($data->slug)) {
                echo json_encode(["success" => false, "error" => "Name and Slug are required"]);
            } else {
                $result = $churchControl->create($data->name, $data->slug, $data->address ?? '');
                echo json_encode($result);
            }
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
