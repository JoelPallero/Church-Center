<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../backend/src/Auth.php';
require_once __DIR__ . '/../../backend/src/Debug.php';

$auth = new Auth();

// SEGURIDAD: Solo Master puede ver los logs
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
    echo json_encode(["message" => "Only for Master System"]);
    exit();
}

echo json_encode([
    "success" => true,
    "logs" => Debug::getTail(100)
]);
?>