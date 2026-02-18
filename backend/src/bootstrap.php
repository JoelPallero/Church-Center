<?php
/**
 * MSM2 Backend Bootstrapper
 * Handles modular service loading for local and production environments.
 */

class Bootstrapper
{
    private static $basePath = null;

    public static function init()
    {
        if (self::$basePath !== null)
            return;

        $possibleRoots = [
            __DIR__ . '/',                                    // Local (relative to bootstrap.php)
            __DIR__ . '/../../backend/src/',                  // From public/api/
            __DIR__ . '/../../msm_logic/src/',                // Pro (Sibling of public_html)
            __DIR__ . '/../../../msm_logic/src/'              // Pro (Root of account)
        ];

        foreach ($possibleRoots as $root) {
            if (file_exists($root . 'core/Auth.php')) {
                self::$basePath = $root;
                break;
            }
        }

        if (!self::$basePath) {
            http_response_code(500);
            echo json_encode(["message" => "Critical Error: Backend logic root not found."]);
            exit();
        }
    }

    public static function getPath($module, $className)
    {
        self::init();
        return self::$basePath . "$module/$className.php";
    }

    public static function require($module, $className)
    {
        $path = self::getPath($module, $className);
        if (file_exists($path)) {
            require_once $path;
        } else {
            error_log("Bootstrapper: File not found: $path");
        }
    }
}

// Initializing the bootstrapper
Bootstrapper::init();

/**
 * PROFESSIONAL SESSION & CORS CONFIGURATION
 */
// 1. Session Security
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Lax');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 2. CORS Handling (For withCredentials compatibility)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
} else {
    header("Access-Control-Allow-Origin: *");
}
