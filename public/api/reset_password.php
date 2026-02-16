<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../backend/src/Auth.php';
$auth = new Auth();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->token) && !empty($data->password)) {
    $result = $auth->resetPassword($data->token, $data->password);
    if ($result['success']) {
        echo json_encode(["success" => true, "message" => "Contraseña actualizada correctamente."]);
    } else {
        http_response_code(400);
        echo json_encode($result);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Token and password are required."]);
}
