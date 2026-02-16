<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../backend/src/Auth.php';

$auth = new Auth();
$db = $auth->getDb();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Check Auth
$headers = getallheaders();
$token = null;
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
    if ($method === 'GET' && $action === 'instruments') {
        $stmt = $db->query("SELECT id, name, code FROM instruments ORDER BY name ASC");
        echo json_encode(["instruments" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } elseif ($method === 'POST' && $action === 'update_my_instruments') {
        $data = json_decode(file_get_contents("php://input"));
        if ($data && isset($data->instrumentIds)) {
            $memberId = $payload['mid'];

            // Delete current
            $stmt = $db->prepare("DELETE FROM member_instruments WHERE member_id = :mid");
            $stmt->execute([':mid' => $memberId]);

            // Insert new
            if (!empty($data->instrumentIds)) {
                $sql = "INSERT INTO member_instruments (member_id, instrument_id) VALUES (:mid, :iid)";
                $ins = $db->prepare($sql);
                foreach ($data->instrumentIds as $iid) {
                    $ins->execute([':mid' => $memberId, ':iid' => $iid]);
                }
            }
            echo json_encode(["success" => true]);
        }
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Action not found"]);
    }
} catch (Exception $e) {
    // Only log if Debug class exists or is loaded
    if (class_exists('Debug')) {
        Debug::error("API Music Error: " . $e->getMessage());
    }
    http_response_code(500);
    echo json_encode(["message" => "Ocurrió un error inesperado."]);
}
?>