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
require_once __DIR__ . '/../../backend/src/ActivityManager.php';

$auth = new Auth();
$activityManager = new ActivityManager();

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

try {
    $token = getBearerToken();
    if (!$token) {
        http_response_code(401);
        echo json_encode(["message" => "Token is missing."]);
        exit();
    }

    $payload = $auth->validateJWT($token);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(["message" => "Invalid or expired token."]);
        exit();
    }

    $isMaster = $payload['role'] === 'master';
    $churchId = $payload['cid'];
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;

    $activities = $activityManager->getActivities($churchId, $isMaster, $limit);

    echo json_encode([
        "success" => true,
        "activities" => $activities
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server Error: " . $e->getMessage()]);
}
?>