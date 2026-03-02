<?php
require_once __DIR__ . '/../../backend/src/bootstrap.php';
$db = \App\Database::getInstance();
$sql = "CREATE TABLE IF NOT EXISTS member_areas (
    member_id INT NOT NULL,
    area_id INT NOT NULL,
    PRIMARY KEY (member_id, area_id),
    FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
try {
    $db->exec($sql);
    echo "Table member_areas created successfully";
}
catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
