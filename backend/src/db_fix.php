<?php
require 'bootstrap.php';
try {
    $db = \App\Database::getInstance();
    $db->exec("ALTER TABLE member ADD COLUMN can_create_teams TINYINT(1) DEFAULT 0;");
    echo "Column added.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
