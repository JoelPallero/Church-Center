<?php
require_once __DIR__ . '/../../backend/config/Database.php';

try {
    $db = Database::getInstance()->getConnection();

    // 1. Make church_id nullable in songs table
    $sql = "ALTER TABLE songs MODIFY church_id INT NULL";
    $db->exec($sql);

    echo "Migration Success: songs.church_id is now NULLABLE.\n";

} catch (Exception $e) {
    echo "Migration Error: " . $e->getMessage() . "\n";
}
