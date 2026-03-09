<?php
define('APP_ROOT', __DIR__ . '/backend');
require_once __DIR__ . '/backend/src/bootstrap.php';
require_once __DIR__ . '/backend/src/Database.php';

use App\Database;

try {
    $db = Database::getInstance();

    echo "--- ROLE PERMISSIONS FOR PASTOR (Role ID 2) ---\n";
    $stmt = $db->prepare("
        SELECT p.name 
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = 2
    ");
    $stmt->execute();
    $perms = $stmt->fetchAll(PDO::FETCH_COLUMN);
    print_r($perms);

    echo "\n--- ALL PERMISSIONS ---\n";
    $stmt = $db->query("SELECT id, name FROM permissions");
    $allPerms = $stmt->fetchAll();
    foreach ($allPerms as $p) {
        echo "{$p['id']}: {$p['name']}\n";
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
