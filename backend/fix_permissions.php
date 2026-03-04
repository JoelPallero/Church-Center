<?php
define('APP_ROOT', dirname(__DIR__));
require_once __DIR__ . '/src/Database.php';

use App\Database;

try {
    $db = Database::getInstance();

    echo "Updating role permissions...<br>";

    $queries = [
        // 1. MEMBER
        "INSERT INTO role_permissions (role_id, permission_id)
         SELECT r.id, p.id FROM roles r 
         JOIN services s ON s.id = r.service_id 
         JOIN permissions p WHERE r.name='member' AND s.`key`='mainhub' 
         AND p.name IN ('team.read', 'calendar.read', 'song.read')
         ON DUPLICATE KEY UPDATE role_id=role_id",

        // 2. COORDINATOR
        "INSERT INTO role_permissions (role_id, permission_id)
         SELECT r.id, p.id FROM roles r 
         JOIN services s ON s.id = r.service_id 
         JOIN permissions p WHERE r.name='coordinator' AND s.`key`='mainhub' 
         AND p.name IN ('team.read', 'calendar.read', 'song.read', 'song.create', 'song.update')
         ON DUPLICATE KEY UPDATE role_id=role_id",

        // 3. LEADER
        "INSERT INTO role_permissions (role_id, permission_id)
         SELECT r.id, p.id FROM roles r 
         JOIN services s ON s.id = r.service_id 
         JOIN permissions p WHERE r.name='leader' AND s.`key`='mainhub' 
         AND p.name IN ('team.read', 'team.create', 'team.update', 'team.manage_members', 'calendar.read', 'meeting.create', 'meeting.update', 'song.read', 'song.create', 'song.update', 'song.delete')
         ON DUPLICATE KEY UPDATE role_id=role_id",

        // 4. PASTOR
        "INSERT INTO role_permissions (role_id, permission_id)
         SELECT r.id, p.id FROM roles r 
         JOIN services s ON s.id = r.service_id 
         JOIN permissions p WHERE r.name='pastor' AND s.`key`='mainhub' 
         AND p.name IN ('church.read', 'church.update', 'area.create', 'area.update', 'team.read', 'team.create', 'team.update', 'team.manage_members', 'person.read', 'calendar.read', 'meeting.create', 'meeting.update', 'song.read', 'song.create', 'song.update', 'song.delete', 'song.approve', 'reports.view')
         ON DUPLICATE KEY UPDATE role_id=role_id"
    ];

    foreach ($queries as $sql) {
        $db->exec($sql);
    }

    echo "Permissions updated successfully!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
