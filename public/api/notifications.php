<?php
/**
 * notifications.php - API for User Notifications
 */

require_once __DIR__ . '/../../backend/src/Auth.php';
require_once __DIR__ . '/../../backend/src/NotificationManager.php';

header("Content-Type: application/json");

$auth = new Auth();
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
    echo json_encode(["message" => "Unauthorized"]);
    exit();
}

$mid = $payload['mid'];
$notifManager = new NotificationManager();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

if ($method === 'GET' && $action === 'list') {
    $list = $notifManager->listForUser($mid);
    $unread = $notifManager->getUnreadCount($mid);
    echo json_encode(["success" => true, "notifications" => $list, "unreadCount" => $unread]);

} elseif ($method === 'POST' && $action === 'read') {
    $data = json_decode(file_get_contents("php://input"));
    if ($data && !empty($data->id)) {
        $success = $notifManager->markAsRead($data->id, $mid);
        echo json_encode(["success" => $success]);
    }
} elseif ($method === 'POST' && $action === 'check_profile') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!empty($data['message'])) {
        $notifManager->ensureProfileNotification($mid, $data['message']);
    }
    echo json_encode(["success" => true]);
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
}
