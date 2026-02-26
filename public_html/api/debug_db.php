<?php
require_once __DIR__ . '/../../backend/src/bootstrap.php';
header('Content-Type: text/plain');

echo "--- DATABASE CONNECTION TEST ---\n\n";

try {
    echo "Testing Primary DB (main)...\n";
    $db1 = \App\Database::getInstance('main');
    $stmt1 = $db1->query("SELECT COUNT(*) FROM church");
    echo "SUCCESS: Primary DB connected. Church count: " . $stmt1->fetchColumn() . "\n\n";
} catch (Exception $e) {
    echo "FAILURE: Primary DB error: " . $e->getMessage() . "\n\n";
}

try {
    echo "Testing Music DB (music)...\n";
    $db2 = \App\Database::getInstance('music');
    $stmt2 = $db2->query("SELECT COUNT(*) FROM songs");
    echo "SUCCESS: Music DB connected. Song count: " . $stmt2->fetchColumn() . "\n\n";
} catch (Exception $e) {
    echo "FAILURE: Music DB error: " . $e->getMessage() . "\n\n";
}

echo "\n--- ENVIRONMENT CHECK ---\n";
echo "APP_ROOT: " . APP_ROOT . "\n";
echo "CONFIG FILE EXISTS: " . (file_exists(APP_ROOT . '/config/database.env') ? 'YES' : 'NO') . "\n";
echo "PHP VERSION: " . PHP_VERSION . "\n";
echo "SERVER SOFTWARE: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "\n";
