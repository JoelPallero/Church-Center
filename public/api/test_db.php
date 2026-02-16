<?php
header("Content-Type: application/json");
require_once __DIR__ . '/../../backend/config/Database.php';

try {
    $db = Database::getInstance()->getConnection();

    $info = [];

    // Check Roles
    $stmt = $db->query("SELECT * FROM roles");
    $info['roles'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Check Songs count
    $stmt = $db->query("SELECT COUNT(*) FROM songs");
    $info['songs_count'] = $stmt->fetchColumn();

    // Check Last 5 songs
    $stmt = $db->query("SELECT id, title, church_id FROM songs ORDER BY id DESC LIMIT 5");
    $info['last_songs'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Check Current User Table (sample)
    $stmt = $db->query("SELECT id, email, role_id FROM member LIMIT 1");
    $info['sample_member'] = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "data" => $info]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
