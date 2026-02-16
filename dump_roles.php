<?php
require_once __DIR__ . '/backend/src/Auth.php';
$auth = new Auth();
$stmt = $auth->getDb()->query("SELECT id, name, level FROM roles");
$roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($roles, JSON_PRETTY_PRINT);
