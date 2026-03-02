<?php
require_once __DIR__ . '/../../../backend/src/bootstrap.php';
$db = \App\Database::getInstance();

header('Content-Type: text/plain');

echo "Updating service keys...\n";
$db->exec("UPDATE services SET `key` = 'mainhub' WHERE `key` = 'church_center'");
$db->exec("UPDATE services SET `key` = 'worship' WHERE `key` = 'ministry_hub'");
$db->exec("UPDATE services SET `key` = 'social' WHERE `key` = 'sm_hub'");

echo "Ensuring worship roles exist...\n";
$worshipRes = $db->query("SELECT id FROM services WHERE `key` = 'worship'")->fetch();
$worshipServiceId = $worshipRes['id'] ?? null;

$mainhubRes = $db->query("SELECT id FROM services WHERE `key` = 'mainhub'")->fetch();
$mainhubServiceId = $mainhubRes['id'] ?? null;

if ($worshipServiceId && $mainhubServiceId) {
    // Copy roles from mainhub to worship if they don't exist
    $roles = ['pastor', 'leader', 'coordinator', 'member'];
    foreach ($roles as $roleName) {
        $stmt = $db->prepare("SELECT * FROM roles WHERE name = ? AND service_id = ?");
        $stmt->execute([$roleName, $worshipServiceId]);
        if (!$stmt->fetch()) {
            echo "Creating role $roleName for worship...\n";
            $source = $db->prepare("SELECT display_name, description, level FROM roles WHERE name = ? AND service_id = ?");
            $source->execute([$roleName, $mainhubServiceId]);
            $data = $source->fetch();
            if ($data) {
                $ins = $db->prepare("INSERT INTO roles (service_id, name, display_name, description, level, is_system_role) VALUES (?, ?, ?, ?, ?, 1)");
                $ins->execute([$worshipServiceId, $roleName, $data['display_name'], $data['description'], $data['level']]);
            }
        }
    }
}

echo "Linking all users to worship service...\n";
$users = $db->query("SELECT member_id, church_id, role_id FROM user_service_roles WHERE service_id = $mainhubServiceId")->fetchAll();
foreach ($users as $u) {
    // Find equivalent role in worship
    $rStmt = $db->prepare("SELECT name FROM roles WHERE id = ?");
    $rStmt->execute([$u['role_id']]);
    $roleName = $rStmt->fetchColumn();

    $wrStmt = $db->prepare("SELECT id FROM roles WHERE name = ? AND service_id = ?");
    $wrStmt->execute([$roleName, $worshipServiceId]);
    $worshipRoleId = $wrStmt->fetchColumn();

    if ($worshipRoleId) {
        $stmt = $db->prepare("INSERT IGNORE INTO user_service_roles (member_id, church_id, service_id, role_id) VALUES (?, ?, ?, ?)");
        $stmt->execute([$u['member_id'], $u['church_id'], $worshipServiceId, $worshipRoleId]);
    }
}

echo "Done!\n";
