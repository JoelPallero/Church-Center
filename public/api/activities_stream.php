<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../../backend/src/Auth.php';
require_once __DIR__ . '/../../backend/src/ActivityManager.php';

$auth = new Auth();
$activityManager = new ActivityManager();

$token = $_GET['token'] ?? null;
if (!$token) {
    echo "event: error\n";
    echo "data: " . json_encode(["message" => "Token is missing."]) . "\n\n";
    exit();
}

$payload = $auth->validateJWT($token);
if (!$payload) {
    echo "event: error\n";
    echo "data: " . json_encode(["message" => "Invalid or expired token."]) . "\n\n";
    exit();
}

$isMaster = $payload['role'] === 'master';
$churchId = $payload['cid'];

// Get the last seen ID from the client, or start from 0
$lastId = isset($_GET['lastId']) ? (int) $_GET['lastId'] : 0;
if (isset($_SERVER['HTTP_LAST_EVENT_ID'])) {
    $lastId = (int) $_SERVER['HTTP_LAST_EVENT_ID'];
}

// Simple loop to check for changes
while (true) {
    if (connection_aborted())
        break;

    $activities = $activityManager->getActivitiesAfterId($churchId, $lastId, $isMaster);

    if (!empty($activities)) {
        foreach ($activities as $activity) {
            echo "id: " . $activity['id'] . "\n";
            echo "data: " . json_encode($activity) . "\n\n";
            $lastId = $activity['id'];
        }
        ob_flush();
        flush();
    }

    // Sleep for a short while before checking again
    sleep(2); // Check every 2 seconds - much more responsive than 30s polling
}
?>