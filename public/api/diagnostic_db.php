<?php
/**
 * Standalone Diagnostic Tool for MinistryHub Database Separation
 */
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Content-Type: text/plain");

require_once __DIR__ . '/../../backend/config/Database.php';

echo "=== MinistryHub DATABASE DIAGNOSTIC ===\n\n";

try {
    $db = Database::getInstance();
    $config = $db->getConfig();

    echo "1. Configuration Check:\n";
    echo "   Main Host: " . ($config['DB_HOST'] ?? 'MISSING') . "\n";
    echo "   Main Port: " . ($config['DB_PORT'] ?? 'MISSING') . "\n";
    echo "   Main DB:   " . ($config['DB_NAME'] ?? 'MISSING') . "\n";
    echo "   Music DB:  " . ($config['MUSIC_DB_NAME'] ?? 'MISSING') . "\n";
    echo "   Environment: " . ($config['APP_ENV'] ?? 'NOT SET') . "\n\n";

    echo "2. Connection Tests:\n";
    $test = $db->testConnection();

    echo "   Main Database Connection: [" . strtoupper($test['main']) . "]\n";
    echo "   Music Database Connection: [" . strtoupper($test['music']) . "]\n\n";

    if (!empty($test['errors'])) {
        echo "3. Error Log:\n";
        foreach ($test['errors'] as $error) {
            echo "   - $error\n";
        }
        echo "\n";
    }

    echo "4. Database Version Info:\n";
    $info = $db->getDatabaseInfo();
    if ($info) {
        echo "   Database Name: " . $info['db_name'] . "\n";
        echo "   MySQL Version: " . $info['version'] . "\n";
    }

} catch (Throwable $e) {
    echo "!!! CRITICAL DIAGNOSTIC FAILURE !!!\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " (Line " . $e->getLine() . ")\n";
    echo "Stack Trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== END OF DIAGNOSTIC ===\n";
