<?php
require_once __DIR__ . '/../../backend/src/Database.php';
$db = \App\Database::getInstance();

$churchQuery = $db->query("SELECT id, name FROM church");
$churches = $churchQuery->fetchAll(PDO::FETCH_ASSOC);

echo "CHURCHES:\n";
print_r($churches);

echo "\nCALENDARS:\n";
$calQuery = $db->query("SELECT * FROM calendars");
print_r($calQuery->fetchAll(PDO::FETCH_ASSOC));

echo "\nMEETINGS (count by church):\n";
$meetQuery = $db->query("
    SELECT c.church_id, COUNT(*) as count 
    FROM meetings m 
    JOIN calendars c ON m.calendar_id = c.id 
    GROUP BY c.church_id
");
print_r($meetQuery->fetchAll(PDO::FETCH_ASSOC));

echo "\nRAW MEETINGS (last 5):\n";
$lastMeet = $db->query("SELECT * FROM meetings ORDER BY id DESC LIMIT 5");
print_r($lastMeet->fetchAll(PDO::FETCH_ASSOC));
