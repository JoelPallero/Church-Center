<?php
header('Content-Type: application/json');
/**
 * SMART BOOTSTRAPPER
 */
$bootstrapPaths = [
    __DIR__ . '/../../src/bootstrap.php',
    __DIR__ . '/../../../msm_logic/src/bootstrap.php',
    __DIR__ . '/../../../../msm_logic/src/bootstrap.php'
];

foreach ($bootstrapPaths as $p) {
    if (file_exists($p)) {
        require_once $p;
        break;
    }
}

if (!class_exists('Bootstrapper')) {
    http_response_code(500);
    echo json_encode(["message" => "Critical Error: Bootstrapper not found."]);
    exit();
}

Bootstrapper::require('core', 'Auth');
Bootstrapper::require('modules/mainhub', 'ReportManager');
Bootstrapper::require('core', 'Debug');

$auth = new Auth();
$payload = $auth->checkAuth();

if (!$payload) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Unauthorized"]);
    exit;
}

$report = new ReportManager();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'all';

try {
    if ($method === 'GET') {
        $churchId = $payload['cid'];

        if ($action === 'kpis') {
            echo json_encode(["success" => true, "data" => $report->getKpis($churchId)]);
        } elseif ($action === 'growth') {
            echo json_encode(["success" => true, "data" => $report->getAttendanceGrowth($churchId)]);
        } elseif ($action === 'distribution') {
            echo json_encode(["success" => true, "data" => $report->getAreaDistribution($churchId)]);
        } elseif ($action === 'team_stats') {
            echo json_encode(["success" => true, "data" => $report->getTeamStats($churchId)]);
        } else {
            // Fetch everything in one go for efficiency
            echo json_encode([
                "success" => true,
                "data" => [
                    "kpis" => $report->getKpis($churchId),
                    "growth" => $report->getAttendanceGrowth($churchId),
                    "distribution" => $report->getAreaDistribution($churchId),
                    "teamStats" => $report->getTeamStats($churchId)
                ]
            ]);
        }
    } else {
        http_response_code(405);
        echo json_encode(["success" => false, "error" => "Method not allowed"]);
    }
} catch (Exception $e) {
    Debug::error("API_REPORTS_ERROR | " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Internal server error"]);
}
