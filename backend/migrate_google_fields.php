<?php
require_once __DIR__ . '/src/bootstrap.php';
use App\Database;

$db = Database::getInstance();
try {
    $db->exec("ALTER TABLE member ADD COLUMN google_calendar_id VARCHAR(255) DEFAULT NULL");
    echo "google_calendar_id added\n";
} catch (Exception $e) {
    echo "Error or already exists: " . $e->getMessage() . "\n";
}

try {
    $db->exec("ALTER TABLE member ADD COLUMN google_api_key VARCHAR(255) DEFAULT NULL");
    echo "google_api_key added\n";
} catch (Exception $e) {
    echo "Error or already exists: " . $e->getMessage() . "\n";
}
