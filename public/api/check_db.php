<?php
header("Content-Type: text/plain");
require_once __DIR__ . '/backend/src/Auth.php';

try {
    $db = Database::getInstance()->getConnection();

    $tables = ['member', 'audit_log', 'roles', 'status', 'area', 'member_area'];
    foreach ($tables as $table) {
        echo "\n--- Columns for $table ---\n";
        $stmt = $db->query("DESCRIBE `$table` ");
        if ($stmt) {
            print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
        } else {
            echo "Error describing table $table\n";
        }
    }

} catch (Exception $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n";
}
