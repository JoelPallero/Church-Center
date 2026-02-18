<?php
/**
 * DATABASE DIAGNOSTIC TOOL
 * Use this to verify why the database is not connecting in Docker.
 */
header('Content-Type: text/plain; charset=UTF-8');

echo "=========================================\n";
echo "   MINISTRY HUB - DB DIAGNOSTIC TOOL    \n";
echo "=========================================\n\n";

// 1. Check PHP / Environment
echo "--- System Info ---\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Hostname: " . gethostname() . "\n";
echo "Time: " . date('Y-m-d H:i:s') . "\n\n";

// 2. Environment Variables
echo "--- Environment Variables (from Docker/OS) ---\n";
$vars = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASS',
    'MUSIC_DB_HOST',
    'MUSIC_DB_NAME',
    'MUSIC_DB_USER',
    'MUSIC_DB_PASS'
];

foreach ($vars as $v) {
    $val = getenv($v);
    if ($val === false) {
        echo "[MISSING] $v\n";
    } else {
        // Obfuscate password for security
        $displayVal = (strpos($v, 'PASS') !== false) ? "********" : $val;
        echo "[FOUND]   $v = $displayVal\n";
    }
}
echo "\n";

// 3. Network Connectivity
echo "--- Network Connectivity ---\n";
$host = getenv('DB_HOST') ?: 'db';
echo "Resolving host '$host'...\n";
$ip = gethostbyname($host);
if ($ip === $host) {
    echo "⚠️  DNS FAILURE: Could not resolve '$host'. Is the container named 'db'?\n";
} else {
    echo "✅ SUCCESS: Resolved '$host' to $ip\n";
}

$port = getenv('DB_PORT') ?: '3306';
echo "Checking port $port on '$host'...\n";
$connection = @fsockopen($host, $port, $errno, $errstr, 5);
if ($connection) {
    echo "✅ SUCCESS: Port $port is reachable.\n";
    fclose($connection);
} else {
    echo "❌ FAILURE: Port $port is NOT reachable. Error: $errstr ($errno)\n";
}
echo "\n";

// 4. PDO Connection Test
echo "--- PDO Connection Test ---\n";

function test_connection($dsn, $user, $pass, $label)
{
    try {
        echo "Testing $label...\n";
        echo "DSN: $dsn\n";
        $start = microtime(true);
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5
        ]);
        $end = microtime(true);
        $time = round($end - $start, 4);
        echo "✅ SUCCESS: Connected to $label in $time seconds!\n";

        $stmt = $pdo->query("SELECT VERSION()");
        echo "MySQL Version: " . $stmt->fetchColumn() . "\n";

        $stmt = $pdo->query("SELECT DATABASE()");
        echo "Active DB: " . $stmt->fetchColumn() . "\n";

    } catch (PDOException $e) {
        echo "❌ FAILURE: Connection failed.\n";
        echo "Error Code: " . $e->getCode() . "\n";
        echo "Message: " . $e->getMessage() . "\n";
    }
    echo "-----------------------------------------\n";
}

// Test Main DB
$main_dsn = "mysql:host=" . (getenv('DB_HOST') ?: 'db') .
    ";port=" . (getenv('DB_PORT') ?: '3306') .
    ";dbname=" . (getenv('DB_NAME') ?: 'database_schema_master') .
    ";charset=utf8mb4";
test_connection($main_dsn, getenv('DB_USER') ?: 'ministry', getenv('DB_PASS') ?: 'ministry', "Main Database");

// Test Music DB
$music_host = getenv('MUSIC_DB_HOST') ?: (getenv('DB_HOST') ?: 'db');
$music_dsn = "mysql:host=" . $music_host .
    ";port=" . (getenv('DB_PORT') ?: '3306') .
    ";dbname=" . (getenv('MUSIC_DB_NAME') ?: 'music_center') .
    ";charset=utf8mb4";
test_connection($music_dsn, getenv('MUSIC_DB_USER') ?: 'ministry', getenv('MUSIC_DB_PASS') ?: 'ministry', "Music Database");

echo "\n--- Recommendations ---\n";
if ($ip === $host) {
    echo "- Check your docker-compose.yml: ensures the mysql service is named 'db'.\n";
}
if (!$connection) {
    echo "- Ensure the 'db' container is running and healthy.\n";
    echo "- Check Docker networks: both containers must be on the same network.\n";
}
echo "- If you see 'Access denied', verify the username and password in docker-compose.yml.\n";

echo "\n=========================================\n";
echo "           END OF DIAGNOSTIC            \n";
echo "=========================================\n";
