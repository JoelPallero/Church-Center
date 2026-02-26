<?php
require_once __DIR__ . '/../../backend/src/bootstrap.php';
$db = \App\Database::getInstance();
$stmt = $db->query("SELECT email FROM user_accounts WHERE email = 'admin@system.master'");
$user = $stmt->fetch();
if ($user) {
    echo "USER FOUND: " . $user['email'] . "\n";
} else {
    echo "USER NOT FOUND in DB\n";
}
