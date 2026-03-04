<?php
/**
 * BACKEND CONNECTION & LOGIN TEST
 * Purpose: Verify main and music database connections and simulate login flow.
 */

require_once __DIR__ . '/src/bootstrap.php';

use App\Database;
use App\Repositories\UserRepo;
use App\Repositories\SongRepo;

// Force CLI output for better readability if run from terminal
if (php_sapi_name() !== 'cli') {
    header('Content-Type: text/plain; charset=utf-8');
}

echo "--- CHURCH CENTER: BACKEND STABILITY TEST ---\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n\n";

$failed = false;

// 1. MAIN DATABASE CONNECTION
try {
    echo "[PHASE 1] Main Database Connectivity... ";
    $mainDb = Database::getInstance('main');
    $stmt = $mainDb->query("SELECT VERSION()");
    $version = $stmt->fetchColumn();
    echo "OK (MySQL Version: $version)\n";
} catch (\Exception $e) {
    echo "FAILED\n   Error: " . $e->getMessage() . "\n";
    $failed = true;
}

// 2. MUSIC DATABASE CONNECTION
try {
    echo "[PHASE 2] Music Database Connectivity... ";
    $musicDb = Database::getInstance('music');
    $stmt = $musicDb->query("SELECT VERSION()");
    $version = $stmt->fetchColumn();
    echo "OK (MySQL Version: $version)\n";
} catch (\Exception $e) {
    echo "FAILED\n   Error: " . $e->getMessage() . "\n";
    $failed = true;
}

// 3. LOGIN LOGIC VERIFICATION
try {
    echo "[PHASE 3] User Authentication Logic... ";
    $testEmail = 'admin@system.master';
    $user = UserRepo::findByEmail($testEmail);

    if (!$user) {
        throw new \Exception("Superadmin user ($testEmail) not found in database.");
    }

    // The password from credentials.sql is 'Master2026!'
    $password = 'Master2026!';
    if (password_verify($password, $user['password_hash'])) {
        echo "OK (Authentication successful for $testEmail)\n";
    } else {
        echo "FAILED (Password mismatch for existing user $testEmail)\n";
        $failed = true;
    }
} catch (\Exception $e) {
    echo "FAILED\n   Error: " . $e->getMessage() . "\n";
    $failed = true;
}

// 4. MUSIC LIBRARY DATA VERIFICATION
try {
    echo "[PHASE 4] Music Repository Data Retrieval... ";
    $songs = SongRepo::getAll();
    if (empty($songs)) {
        echo "WARNING (Database connected but no active songs found)\n";
    } else {
        echo "OK (" . count($songs) . " songs detected)\n";
        echo "   Sample Entry: [" . $songs[0]['id'] . "] " . $songs[0]['title'] . " by " . $songs[0]['artist'] . "\n";
    }
} catch (\Exception $e) {
    echo "FAILED\n   Error: " . $e->getMessage() . "\n";
    $failed = true;
}

echo "\n--- TEST SUMMARY ---\n";
if ($failed) {
    echo "STATUS: FAIL - Please check database configurations in /backend/config/database.env\n";
} else {
    echo "STATUS: SUCCESS - Backend is fully operational.\n";
}
echo "----------------------------------------------\n";
