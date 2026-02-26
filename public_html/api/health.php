<?php
require_once __DIR__ . '/../../backend/src/bootstrap.php';
header('Content-Type: text/plain');

echo "=== SYSTEM HEALTH CHECK ===\n\n";

// 1. Environment
echo "[1] Environment Info:\n";
echo "    - PHP Version: " . PHP_VERSION . "\n";
echo "    - APP_ROOT: " . (defined('APP_ROOT') ? APP_ROOT : 'NOT DEFINED') . "\n";
echo "    - Current DIR: " . __DIR__ . "\n";
echo "    - Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n\n";

// 2. File Access
echo "[2] File Permissions:\n";
$configPath = APP_ROOT . '/config/database.env';
echo "    - Config file exists: " . (file_exists($configPath) ? "YES" : "NO") . "\n";
$logsDir = APP_ROOT . '/logs';
echo "    - Logs dir exists: " . (is_dir($logsDir) ? "YES" : "NO") . "\n";
echo "    - Logs dir writable: " . (is_writable($logsDir) ? "YES" : "NO") . "\n\n";

// 3. Database Connectivity
echo "[3] Databases:\n";
try {
    $db1 = \App\Database::getInstance('main');
    echo "    - Primary DB (main): CONNECTED ✅\n";
    $stmt = $db1->query("SELECT COUNT(*) FROM church");
    echo "      (Query test: OK, Church count: " . $stmt->fetchColumn() . ")\n";
} catch (Exception $e) {
    echo "    - Primary DB (main): FAILED ❌ (" . $e->getMessage() . ")\n";
}

try {
    $db2 = \App\Database::getInstance('music');
    echo "    - Music DB (music): CONNECTED ✅\n";
    $stmt = $db2->query("SELECT COUNT(*) FROM songs");
    echo "      (Query test: OK, Song count: " . $stmt->fetchColumn() . ")\n";
} catch (Exception $e) {
    echo "    - Music DB (music): FAILED ❌ (" . $e->getMessage() . ")\n";
}
echo "\n";

// 4. Authorization Header detection
echo "[4] Auth Header Check:\n";
$headers = getallheaders();
echo "    - Authorization Header in getallheaders(): " . (isset($headers['Authorization']) ? "DETECTED" : "MISSING") . "\n";
echo "    - HTTP_AUTHORIZATION in \$_SERVER: " . (isset($_SERVER['HTTP_AUTHORIZATION']) ? "DETECTED" : "MISSING") . "\n";
echo "    - REDIRECT_HTTP_AUTHORIZATION in \$_SERVER: " . (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) ? "DETECTED" : "MISSING") . "\n";
echo "\n";

echo "=== END OF CHECK ===\n";
