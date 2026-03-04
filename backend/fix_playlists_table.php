<?php
define('APP_ROOT', dirname(__DIR__));
require_once __DIR__ . '/src/Database.php';

use App\Database;

try {
    $db = Database::getInstance('music');

    echo "Adding group_id column to playlists table...<br>";

    // Check if column exists
    $stmt = $db->query("SHOW COLUMNS FROM playlists LIKE 'group_id'");
    $exists = $stmt->fetch();

    if (!$exists) {
        $db->exec("ALTER TABLE playlists ADD COLUMN group_id INT NULL AFTER church_id");
        $db->exec("CREATE INDEX idx_playlist_group ON playlists(group_id)");
        echo "Column 'group_id' added successfully!<br>";
    } else {
        echo "Column 'group_id' already exists.<br>";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
