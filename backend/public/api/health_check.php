<?php
header("Content-Type: text/plain");
require_once __DIR__ . '/backend/src/Debug.php';

echo "--- Debug Info ---\n";
echo "Current directory: " . __DIR__ . "\n";
$reflector = new ReflectionClass('Debug');
$fileName = $reflector->getFileName();
echo "Debug class defined in: $fileName\n";

$logFileProperty = $reflector->getProperty('logFile');
$logFileProperty->setAccessible(true);
$logFilePath = $logFileProperty->getValue();
echo "Log file path (from property): $logFilePath\n";
echo "Log file absolute path: " . realpath($logFilePath) . "\n";

if (file_exists($logFilePath)) {
    echo "Log file exists. Size: " . filesize($logFilePath) . " bytes.\n";
    echo "Last 20 lines:\n";
    echo Debug::getTail(20);
} else {
    echo "Log file does NOT exist yet at that location.\n";
    // Try to write something
    Debug::log("Health Check executed at " . date('Y-m-d H:i:s'));
    if (file_exists($logFilePath)) {
        echo "Log file successfully created after manual log call.\n";
    } else {
        echo "FAILED to create log file even after manual call. check permissions of " . dirname($logFilePath) . "\n";
    }
}
