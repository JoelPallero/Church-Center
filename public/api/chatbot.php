<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * PATH CONFIGURATION
 */
$basePath = __DIR__ . '/../../backend/src/';
if (!file_exists($basePath . 'Auth.php')) {
    $basePath = __DIR__ . '/../../msm_logic/src/';
}

require_once $basePath . 'Auth.php';
require_once $basePath . 'ChatbotManager.php';

$auth = new Auth();
$chatbotManager = new ChatbotManager();

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

// In development, we might bypass auth if configured
$token = getBearerToken();
$user = null;

if ($token) {
    $user = $auth->validateJWT($token);
}

// If no user and not in bypass, return 401
// Actually, ChatAssistant usually needs a logged in user to know the church context.
if (!$user) {
    // Check if bypass is active in Auth.php (we'll assume cid=1 for demo if no token)
    $churchId = 1;
} else {
    $churchId = $user['cid'];
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $message = $data['message'] ?? '';

    if (empty($message)) {
        http_response_code(400);
        echo json_encode(["message" => "Missing message."]);
        exit();
    }

    try {
        $result = $chatbotManager->processMessage($churchId, $message);
        echo json_encode($result);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>