<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * SMART PATH DISCOVERY
 */
$possiblePaths = [
    __DIR__ . '/../../backend/src/ChurchManager.php',
    __DIR__ . '/../../msm_logic/src/ChurchManager.php',
    __DIR__ . '/../../../msm_logic/src/ChurchManager.php'
];

$logicPath = null;
foreach ($possiblePaths as $p) {
    if (file_exists($p)) {
        $logicPath = $p;
        break;
    }
}

if (!$logicPath) {
    http_response_code(500);
    echo json_encode(["message" => "Critical Error: ChurchManager not found."]);
    exit();
}

require_once $logicPath;

$churchManager = new ChurchManager();

try {
    $churches = $churchManager->getAll();
    echo json_encode(["success" => true, "churches" => $churches]);
} catch (Exception $e) {
    Debug::error("API Churches Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Ocurrió un error inesperado."]);
}
?>