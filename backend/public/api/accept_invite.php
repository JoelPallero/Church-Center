<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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
Bootstrapper::require('modules/mainhub', 'PeopleManager');

$auth = new Auth();
$people = new PeopleManager();
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $token = $_GET['token'] ?? '';
        if (empty($token)) {
            http_response_code(400);
            echo json_encode(["message" => "Token is required"]);
            exit();
        }

        $invitation = $people->verifyInvitation($token);
        if (!$invitation) {
            http_response_code(404);
            echo json_encode(["message" => "Invalid or expired invitation token."]);
            exit();
        }

        echo json_encode([
            "success" => true,
            "invitation" => [
                "name" => $invitation['name'],
                "email" => $invitation['email'],
                "church" => $invitation['church_name']
            ]
        ]);

    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"));
        if (!$data || empty($data->token) || empty($data->password)) {
            http_response_code(400);
            echo json_encode(["message" => "Token and password are required"]);
            exit();
        }

        // 1. Verify token again
        $invitation = $people->verifyInvitation($data->token);
        if (!$invitation) {
            http_response_code(404);
            echo json_encode(["message" => "Invitation no longer valid."]);
            exit();
        }

        // 2. Complete registration
        $result = $auth->completeRegistration($invitation['member_id'], $data->password);
        echo json_encode($result);

    } else {
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error: " . $e->getMessage()]);
}
?>