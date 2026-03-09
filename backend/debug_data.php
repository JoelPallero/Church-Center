<?php
require_once __DIR__ . '/src/Database.php';
$db = \App\Database::getInstance();
$log = "";

$log .= "CHECKING TABLES:\n";
$tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
$log .= implode(", ", $tables) . "\n\n";

$log .= "CALENDARS:\n";
$cals = $db->query("SELECT * FROM calendars")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cals as $c)
    $log .= json_encode($c) . "\n";

$log .= "\nMEETINGS:\n";
$meets = $db->query("SELECT * FROM meetings")->fetchAll(PDO::FETCH_ASSOC);
foreach ($meets as $m)
    $log .= json_encode($m) . "\n";

$log .= "\nMEMBER DATA:\n";
$members = $db->query("SELECT id, church_id, name, email FROM member LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
foreach ($members as $m)
    $log .= json_encode($m) . "\n";

file_put_contents('debug_output.txt', $log);
echo "Debug finished. Content written to debug_output.txt";
