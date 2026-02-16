<?php
require_once __DIR__ . '/backend/src/PeopleManager.php';
require_once __DIR__ . '/backend/src/Debug.php';

$people = new PeopleManager();

echo "--- VERIFYING FIXES ---\n";

// 1. Check member_area table
try {
    $db = Database::getInstance()->getConnection();
    $stmt = $db->query("SELECT 1 FROM member_area LIMIT 1");
    echo "SUCCESS: 'member_area' table found.\n";
} catch (Exception $e) {
    echo "ERROR: 'member_area' table still missing or inaccessible: " . $e->getMessage() . "\n";
}

// 2. Check getAreas (Fix for unique parameters)
try {
    $areas = $people->getAreas(1);
    echo "SUCCESS: PeopleManager::getAreas(1) executed without error. Found " . count($areas) . " areas.\n";
} catch (Exception $e) {
    echo "ERROR: PeopleManager::getAreas(1) failed: " . $e->getMessage() . "\n";
}

// 3. Check getGroups (Fix for unique parameters)
try {
    $groups = $people->getGroups(1);
    echo "SUCCESS: PeopleManager::getGroups(1) executed without error. Found " . count($groups) . " groups.\n";
} catch (Exception $e) {
    echo "ERROR: PeopleManager::getGroups(1) failed: " . $e->getMessage() . "\n";
}

// 4. Check getAll (Uses member_area)
try {
    $users = $people->getAll();
    echo "SUCCESS: PeopleManager::getAll() executed without error. Found " . count($users) . " users.\n";
} catch (Exception $e) {
    echo "ERROR: PeopleManager::getAll() failed: " . $e->getMessage() . "\n";
}
?>