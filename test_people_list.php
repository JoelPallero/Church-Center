<?php
require_once __DIR__ . '/backend/src/PeopleManager.php';
require_once __DIR__ . '/backend/src/Debug.php';

try {
    $people = new PeopleManager();
    $users = $people->getAll();
    echo "Success! Found " . count($users) . " users.\n";
    echo json_encode($users[0], JSON_PRETTY_PRINT) . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
