<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
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
Bootstrapper::require('core', 'Debug');

$auth = new Auth();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Helper to get Bearer Token
function getBearerToken()
{
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

try {
    if ($method === 'POST' && $action === 'login') {
        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput);
        error_log("[MinistryHub] Login attempt for: " . ($data->email ?? 'unknown'));

        if ($data && !empty($data->email) && !empty($data->password)) {
            $result = $auth->login($data->email, $data->password);

            if ($result['success']) {
                Debug::security("API_AUTH_LOGIN_SUCCESS | Email: " . $data->email);
                http_response_code(200);
                echo json_encode($result);
            } else {
                Debug::security("API_AUTH_LOGIN_FAILED | Email: " . $data->email . " | Error: " . ($result['error'] ?? 'unknown'));
                http_response_code(401);
                echo json_encode($result);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data.", "received" => $rawInput]);
        }
    } elseif ($method === 'GET' && $action === 'me') {
        $token = getBearerToken();
        if ($token) {
            $payload = $auth->validateJWT($token);
            if ($payload) {
                $user = $auth->getUserById($payload['mid']);

                // Fetch permissions for each enabled service
                $permissions = [];
                if (isset($user['services'])) {
                    foreach (array_keys($user['services']) as $serviceKey) {
                        $permissions[$serviceKey] = $auth->getUserPermissions($payload['mid'], $serviceKey);
                    }
                }

                echo json_encode([
                    "success" => true,
                    "user" => $user,
                    "permissions" => $permissions
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["message" => "Invalid or expired token."]);
            }
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Token is missing."]);
        }
    } elseif ($method === 'GET' && $action === 'login') {
        echo json_encode([
            "success" => true,
            "message" => "Auth Endpoint Ready",
            "info" => "Please use POST to login."
        ]);
    } elseif ($method === 'POST' && $action === 'register') {
        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput);

        if ($data && !empty($data->email) && !empty($data->name)) {
            // Check if email exists in DB
            $sql = "SELECT id FROM user_accounts WHERE email = :email";
            $stmt = $auth->getDb()->prepare($sql);
            $stmt->execute([':email' => $data->email]);

            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Ese correo ya está registrado."]);
                exit();
            }

            // Real registration
            $regResult = $auth->register($data);

            if ($regResult['success']) {
                echo json_encode(["success" => true, "message" => "Registro exitoso. Espere aprobación."]);
            } else {
                http_response_code(400); // Bad request instead of 500
                echo json_encode(["success" => false, "message" => $regResult['error']]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos."]);
        }

    } elseif ($method === 'POST' && $action === 'update_settings') {
        $token = getBearerToken();
        if ($token) {
            $payload = $auth->validateJWT($token);
            if ($payload) {
                $rawInput = file_get_contents("php://input");
                $data = json_decode($rawInput);
                if ($data && isset($data->default_theme) && isset($data->default_language)) {
                    $success = $auth->updateUserSettings($payload['mid'], $data->default_theme, $data->default_language);
                    Debug::log("API_AUTH_SETTINGS_UPDATE | UserID: {$payload['mid']} | Success: " . ($success ? 'YES' : 'NO'));
                    echo json_encode(["success" => $success]);
                } else {
                    http_response_code(400);
                    echo json_encode(["message" => "Incomplete data."]);
                }
            } else {
                http_response_code(401);
                echo json_encode(["message" => "Invalid or expired token."]);
            }
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Token is missing."]);
        }
    } elseif ($method === 'POST' && $action === 'delete_profile') {
        $token = getBearerToken();
        if ($token) {
            $payload = $auth->validateJWT($token);
            if ($payload) {
                $result = $auth->deleteProfile($payload['mid']);
                if ($result['success']) {
                    echo json_encode(["success" => true, "message" => "Perfil eliminado correctamente."]);
                } else {
                    http_response_code(400);
                    echo json_encode($result);
                }
            } else {
                http_response_code(401);
                echo json_encode(["message" => "Sesión inválida."]);
            }
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Token ausente."]);
        }
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Endpoint not found or action missing."]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server Error: " . $e->getMessage()]);
}
?>