<?php
define('APP_ROOT', __DIR__ . '/backend');
require_once 'backend/src/Database.php';
require_once 'backend/src/Helpers/Logger.php'; // Might be needed

use App\Database;

try {
    $db = Database::getInstance();
    echo "Connected to DB\n";

    echo "--- Calendars ---\n";
    $stmt = $db->query("SELECT * FROM calendars");
    $calendars = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($calendars);

    echo "\n--- Meetings ---\n";
    $stmt = $db->query("SELECT * FROM meetings");
    $meetings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($meetings);

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
