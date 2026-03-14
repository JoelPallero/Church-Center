<?php
require 'bootstrap.php';
try {
    $db = \App\Database::getInstance();
    $stmt = $db->query("DESCRIBE member");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $columnNames = array_column($columns, 'Field');
    if (in_array('can_create_teams', $columnNames)) {
        echo "Column 'can_create_teams' EXISTS.\n";
    } else {
        echo "Column 'can_create_teams' DOES NOT EXIST.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
