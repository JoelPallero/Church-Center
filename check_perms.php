<?php
require_once __DIR__ . '/backend/src/Database.php';
use App\Database;

$db = Database::getInstance();

echo "--- ROLES ---\n";
$stmt = $db->query("SELECT * FROM roles");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    print_r($row);
}

echo "\n--- PERMISSIONS ---\n";
$stmt = $db->query("SELECT * FROM permissions");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    print_r($row);
}

echo "\n--- PASTOR PERMISSIONS (Role ID 2) ---\n";
$stmt = $db->prepare("
    SELECT p.name 
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = 2
");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_COLUMN));
