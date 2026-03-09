<?php
require_once __DIR__ . '/../../backend/src/bootstrap.php';
use App\Database;

try {
    $db = Database::getInstance();

    // 1. Rename 'ushers' service to 'consolidation'
    $db->exec("UPDATE services SET `key` = 'consolidation', name = 'Consolidación', description = 'Módulo de Registro y Seguimiento de Visitantes' WHERE `key` = 'ushers'");
    echo "Service 'ushers' renamed to 'consolidation'.\n";

    // 2. Create 'visitors' table
    $db->exec("
        CREATE TABLE IF NOT EXISTS visitors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            church_id INT NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NULL,
            whatsapp VARCHAR(40) NULL,
            email VARCHAR(190) NULL,
            first_meeting_id INT NULL,
            prayer_requests TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
            FOREIGN KEY (first_meeting_id) REFERENCES meetings(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    echo "Table 'visitors' created.\n";

    // 3. Create 'visitor_follow_up' table
    $db->exec("
        CREATE TABLE IF NOT EXISTS visitor_follow_up (
            id INT AUTO_INCREMENT PRIMARY KEY,
            visitor_id INT NOT NULL,
            contact_date DATE NOT NULL,
            contact_method VARCHAR(100) NULL,
            comments TEXT NULL,
            created_by_member_id INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by_member_id) REFERENCES member(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    echo "Table 'visitor_follow_up' created.\n";

    // 4. Update meeting_visitors to link to visitors (optional but recommended)
    // For now we'll keep meeting_visitors as is for attendance tracking, 
    // but the consolidation module will use the visitors table for the database.

    echo "Consolidation database updates completed successfully.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
