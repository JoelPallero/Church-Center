<?php
require_once __DIR__ . '/src/Database.php';
use App\Database;

try {
    $db = Database::getInstance('music');
    $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        echo "Table: $table\n";
        $columns = $db->query("SHOW COLUMNS FROM $table")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($columns as $column) {
            echo "  - {$column['Field']} ({$column['Type']})\n";
        }
        echo "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
