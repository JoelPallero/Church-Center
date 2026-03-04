<?php
/**
 * DATABASE FIX SCRIPT
 * Adds missing church_id column to the songs table in the music database.
 */

require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/Helpers/Response.php';
require_once __DIR__ . '/src/Helpers/Logger.php';

use App\Database;
use App\Helpers\Response;

define('APP_ROOT', __DIR__);

try {
    $db = Database::getInstance('music');

    // Check if column exists
    $stmt = $db->query("SHOW COLUMNS FROM songs LIKE 'church_id'");
    $exists = $stmt->fetch();

    if (!$exists) {
        $db->exec("ALTER TABLE songs ADD COLUMN church_id INT NOT NULL DEFAULT 0 AFTER id");
        $db->exec("CREATE INDEX idx_song_church ON songs(church_id)");
        echo "<h1>Success!</h1><p>Column 'church_id' added to 'songs' table successfully.</p>";
    } else {
        echo "<h1>Info</h1><p>Column 'church_id' already exists in 'songs' table.</p>";
    }

    echo "<p><a href='/'>Go back to App</a></p>";
} catch (\Exception $e) {
    echo "<h1>Error</h1><p>" . htmlspecialchars($e->getMessage()) . "</p>";
}
