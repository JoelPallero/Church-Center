<?php
/**
 * Developer Seeder for MinistryHub (Web Request edition)
 */

header('Content-Type: text/plain');
require_once __DIR__ . '/../../backend/config/Database.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $musicConn = $db->getMusicConnection();

    echo "Starting seeding process...\n";

    // 1. Ensure Areas exist
    $areas = [
        ['name' => 'Alabanza', 'church_id' => 1],
        ['name' => 'Sonido', 'church_id' => 1],
        ['name' => 'Multimedia', 'church_id' => 1]
    ];

    foreach ($areas as $area) {
        $stmt = $conn->prepare("SELECT id FROM area WHERE name = ? AND church_id = ?");
        $stmt->execute([$area['name'], $area['church_id']]);
        if (!$stmt->fetch()) {
            $stmt = $conn->prepare("INSERT INTO area (name, church_id) VALUES (?, ?)");
            $stmt->execute([$area['name'], $area['church_id']]);
            echo "Area '{$area['name']}' created.\n";
        }
    }

    // 2. Ensure Team "Equipo de Alabanza" exists
    // Get Alabanza area ID
    $stmt = $conn->prepare("SELECT id FROM area WHERE name = 'Alabanza' AND church_id = 1");
    $stmt->execute();
    $areaRow = $stmt->fetch();
    $alabanzaAreaId = $areaRow ? $areaRow['id'] : 1;

    $stmt = $conn->prepare("SELECT id FROM `group` WHERE name = ? AND church_id = ?");
    $stmt->execute(['Equipo de Alabanza', 1]);
    if (!$stmt->fetch()) {
        $stmt = $conn->prepare("INSERT INTO `group` (name, church_id, area_id, description) VALUES (?, ?, ?, ?)");
        $stmt->execute(['Equipo de Alabanza', 1, $alabanzaAreaId, 'Equipo principal de música']);
        echo "Team 'Equipo de Alabanza' created.\n";
    }

    // 3. Insert Fictional Song in MusicCenter
    $stmt = $musicConn->prepare("SELECT id FROM songs WHERE title = ?");
    $stmt->execute(['Tu Presencia (Ficticia)']);
    $song = $stmt->fetch();
    if (!$song) {
        $stmt = $musicConn->prepare("INSERT INTO songs (title, artist, original_key, tempo, bpm_type, time_signature, content, language, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            'Tu Presencia (Ficticia)',
            'Banda MSM',
            'G',
            78,
            'slow',
            '4/4',
            '[G]En tu pres[D]encia[Em]\nhay plen[C]itud de gozo',
            'es',
            'worship'
        ]);
        $masterSongId = $musicConn->lastInsertId();
        echo "Fictional song created in MusicCenter (ID: $masterSongId).\n";
    } else {
        $masterSongId = $song['id'];
    }

    // 4. Link Song to Church 1
    $stmt = $conn->prepare("SELECT id FROM songs WHERE master_song_id = ? AND church_id = ?");
    $stmt->execute([$masterSongId, 1]);
    if (!$stmt->fetch()) {
        $stmt = $conn->prepare("INSERT INTO songs (master_song_id, church_id, created_by) VALUES (?, ?, ?)");
        $stmt->execute([$masterSongId, 1, 1]);
        echo "Song linked to church.\n";
    }

    // 5. Insert People for each role
    $people = [
        ['name' => 'Carlos Pastor', 'email' => 'pastor@example.com', 'role_id' => 2, 'status_id' => 1, 'sex' => 'M'],
        ['name' => 'Lucía Líder', 'email' => 'leader@example.com', 'role_id' => 3, 'status_id' => 1, 'sex' => 'F'],
        ['name' => 'Marcos Coordinador', 'email' => 'coord@example.com', 'role_id' => 4, 'status_id' => 1, 'sex' => 'M'],
        ['name' => 'Sofía Miembro', 'email' => 'member@example.com', 'role_id' => 5, 'status_id' => 1, 'sex' => 'F'],
        ['name' => 'Diego Invitado', 'email' => 'guest@example.com', 'role_id' => 6, 'status_id' => 1, 'sex' => 'M'],
        ['name' => 'Ana Pendiente', 'email' => 'pending@example.com', 'role_id' => 5, 'status_id' => 3, 'sex' => 'F']
    ];

    foreach ($people as $person) {
        $stmt = $conn->prepare("SELECT id FROM member WHERE email = ?");
        $stmt->execute([$person['email']]);
        if (!$stmt->fetch()) {
            $stmt = $conn->prepare("INSERT INTO member (church_id, name, email, role_id, status_id) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([1, $person['name'], $person['email'], $person['role_id'], $person['status_id']]);
            $memberId = $conn->lastInsertId();

            // If active and has role, create user account
            if ($person['status_id'] === 1 && $person['role_id'] <= 5) {
                // Check if account already exists
                $accStmt = $conn->prepare("SELECT id FROM user_accounts WHERE email = ?");
                $accStmt->execute([$person['email']]);
                if (!$accStmt->fetch()) {
                    $accStmt = $conn->prepare("INSERT INTO user_accounts (member_id, email, password_hash, auth_method_id) VALUES (?, ?, ?, ?)");
                    $accStmt->execute([$memberId, $person['email'], password_hash('password123', PASSWORD_DEFAULT), 1]);
                }
            }
            echo "Person '{$person['name']}' created.\n";
        }
    }

    echo "Seeding completed successfully!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
