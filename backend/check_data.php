<?php
require_once __DIR__ . '/src/Database.php';
$db = \App\Database::getInstance();
$count = $db->query("SELECT COUNT(*) FROM meetings")->fetchColumn();
$countCals = $db->query("SELECT COUNT(*) FROM calendars")->fetchColumn();
echo "Meetings: $count\nCalendars: $countCals\n";
