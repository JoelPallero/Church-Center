<?php
header("Content-Type: application/json");
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
Bootstrapper::require('modules/worship', 'SongManager');
Bootstrapper::require('core', 'Debug');

$res = [
    "php_version" => PHP_VERSION,
    "debug_class_exists" => class_exists('Debug'),
    "log_file_path" => realpath(__DIR__ . '/../../backend/logs') ?: 'NOT_FOUND_OR_UNWRITABLE',
    "db_connection" => "FAIL",
    "session_tokens_count" => 0,
    "last_error" => error_get_last()
];

try {
    $db = Database::getInstance()->getConnection();
    $res["db_connection"] = "OK";

    $stmt = $db->query("SELECT COUNT(*) FROM session_tokens");
    $res["session_tokens_count"] = $stmt->fetchColumn();

    $stmt = $db->query("SELECT COUNT(*) FROM songs");
    $res["songs_count"] = $stmt->fetchColumn();

} catch (Exception $e) {
    $res["db_error"] = $e->getMessage();
}

// Test Logging
try {
    Debug::log("DIAGNOSTIC_RUN");
    $res["logging"] = "OK";
} catch (Error $e) {
    $res["logging"] = "ERROR: " . $e->getMessage();
}

echo json_encode($res, JSON_PRETTY_PRINT);
