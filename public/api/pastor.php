<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../backend/src/Auth.php';
require_once __DIR__ . '/../../backend/src/Debug.php';

$auth = new Auth();

// Auth check
$token = null;
$headers = getallheaders();
if (isset($headers['Authorization'])) {
    if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
        $token = $matches[1];
    }
}

if (!$token) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized"]);
    exit();
}

$payload = $auth->validateJWT($token);
// Master or Pastor can access this
if (!$payload || !in_array($payload['role'], ['pastor', 'master'])) {
    http_response_code(403);
    echo json_encode(["message" => "Forbidden. Pastor access required."]);
    exit();
}

$church_id = $payload['cid'];
$db = Database::getInstance()->getConnection();
$action = $_GET['action'] ?? '';

try {
    if ($action === 'dashboard_stats') {
        // 1. Basic Stats
        $stmtActive = $db->prepare("SELECT COUNT(*) FROM member WHERE church_id = ? AND status_id = 1");
        $stmtActive->execute([$church_id]);
        $activeMembers = $stmtActive->fetchColumn();

        $stmtMeetings = $db->prepare("SELECT COUNT(*) FROM meeting WHERE church_id = ? AND date_time >= DATE_SUB(NOW(), INTERVAL 1 MONTH)");
        $stmtMeetings->execute([$church_id]);
        $meetingsCount = $stmtMeetings->fetchColumn();

        // 2. Teams (Groups) - Only show those with members
        $stmtTeams = $db->prepare("
            SELECT g.name, COUNT(mg.member_id) as member_count
            FROM `group` g
            LEFT JOIN member_group mg ON g.id = mg.group_id
            WHERE g.church_id = ?
            GROUP BY g.id
            HAVING member_count > 0
        ");
        $stmtTeams->execute([$church_id]);
        $teams = $stmtTeams->fetchAll(PDO::FETCH_ASSOC);
        foreach ($teams as &$t) {
            $t['status'] = 'ready'; // Simplification for now
        }

        // 3. Real Task Data
        $stmtTasks = $db->prepare("
            SELECT title, status, due_date
            FROM tasks
            WHERE church_id = ?
            ORDER BY created_at DESC LIMIT 5
        ");
        $stmtTasks->execute([$church_id]);
        $tasksList = $stmtTasks->fetchAll(PDO::FETCH_ASSOC);

        $stmtTaskCount = $db->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed
            FROM tasks
            WHERE church_id = ?
        ");
        $stmtTaskCount->execute([$church_id]);
        $taskStats = $stmtTaskCount->fetch(PDO::FETCH_ASSOC);

        $totalTasks = (int) $taskStats['total'];
        $completedTasks = (int) $taskStats['completed'];
        $compliance = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) . '%' : '0%';

        // 4. Next Meeting Setlist
        $stmtNext = $db->prepare("
            SELECT m.id, m.name, m.date_time
            FROM meeting m
            WHERE m.church_id = ? AND m.date_time >= NOW()
            ORDER BY m.date_time ASC LIMIT 1
        ");
        $stmtNext->execute([$church_id]);
        $nextMeeting = $stmtNext->fetch(PDO::FETCH_ASSOC);

        $songs = [];
        if ($nextMeeting) {
            $stmtSongs = $db->prepare("
                SELECT s.title, s.artist, pi.song_key as `key`
                FROM playlist_items pi
                JOIN playlists p ON pi.playlist_id = p.id
                JOIN songs s ON pi.song_id = s.id
                WHERE p.meeting_id = ?
                ORDER BY pi.order_index ASC
            ");
            $stmtSongs->execute([$nextMeeting['id']]);
            $songs = $stmtSongs->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode([
            "success" => true,
            "stats" => [
                "active_members" => (int) $activeMembers,
                "meetings_count" => (int) $meetingsCount,
                "compliance" => $compliance,
                "teams" => $teams,
                "tasks" => $tasksList,
                "next_meeting" => [
                    "info" => $nextMeeting,
                    "songs" => $songs
                ]
            ]
        ]);
    } else {
        echo json_encode(["message" => "Unknown action"]);
    }
} catch (Exception $e) {
    Debug::error("API Pastor Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Ocurrió un error inesperado."]);
}
?>