<?php
require_once __DIR__ . '/../../backend/src/bootstrap.php';
use App\Database;

try {
    $db = Database::getInstance();

    // 1. Add category column
    $db->exec("ALTER TABLE meetings ADD COLUMN category VARCHAR(100) NULL AFTER location");
    echo "Column 'category' added to 'meetings'.\n";

    // 2. Add permission
    $stmt = $db->prepare("INSERT IGNORE INTO permissions (name, display_name, module, description) VALUES (?, ?, ?, ?)");
    $stmt->execute(['meeting.delete', 'Eliminar reuniones', 'calendar', 'Permite eliminar reuniones']);
    echo "Permission 'meeting.delete' added.\n";

    // 3. Assign to Pastor
    $db->exec("
        INSERT IGNORE INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id
        FROM roles r
        JOIN services s ON s.id = r.service_id
        JOIN permissions p
        WHERE r.name='pastor'
          AND s.`key`='mainhub'
          AND p.name='meeting.delete'
    ");
    echo "Permission assigned to Pastor role.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
