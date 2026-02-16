<?php
require_once __DIR__ . '/backend/config/Database.php';
$db = Database::getInstance()->getConnection();

echo "--- ROLES ---\n";
$roles = $db->query("SELECT * FROM roles")->fetchAll(PDO::FETCH_ASSOC);
print_r($roles);

echo "\n--- SAMPLE SONGS ---\n";
$songs = $db->query("SELECT id, title, church_id FROM songs ORDER BY id DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
print_r($songs);
?>