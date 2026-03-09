require_once __DIR__ . '/src/Database.php';
$db = \App\Database::getInstance();
echo "--- CALENDARS ---\n";
print_r($db->query("SELECT * FROM calendars")->fetchAll(PDO::FETCH_ASSOC));
echo "\n--- MEETINGS ---\n";
$res = $db->query("SELECT m.*, c.church_id FROM meetings m JOIN calendars c ON m.calendar_id = c.id LIMIT
50")->fetchAll(PDO::FETCH_ASSOC);
print_r($res);