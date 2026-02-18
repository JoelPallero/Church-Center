<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

Bootstrapper::require('core', 'Auth');
Bootstrapper::require('core', 'Debug');

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