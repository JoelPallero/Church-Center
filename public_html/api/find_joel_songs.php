<?php
require_once __DIR__ . '/backend/src/bootstrap.php';
use App\Database;

try {
    $db = Database::getInstance('music');
    $stmt = $db->query("SELECT id, title, artist, church_id FROM songs WHERE artist LIKE '%Joel Pallero%'");
    $songs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($songs, JSON_PRETTY_PRINT);
}
catch (Exception $e) {
    echo $e->getMessage();
}
