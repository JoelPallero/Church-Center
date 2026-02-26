<?php

require_once __DIR__ . '/../../backend/src/bootstrap.php';

use App\Controllers\AuthController;
use App\Controllers\BootstrapController;
use App\Middleware\AuthMiddleware;
use App\Helpers\Response;

$method = $_SERVER['REQUEST_METHOD'];
$pathParam = $_GET['path'] ?? '';

// Simple Router
// --- Routing Logic ---
if (!empty($pathParam)) {
    $uri = $pathParam;
} else {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $uri = str_replace('/api/', '', $uri);
}

$parts = explode('/', trim($uri, '/'));

$resource = $parts[0] ?? '';
// Legacy compatibility: strip .php and handle ?action=
$resource = str_replace('.php', '', $resource);
$action = $parts[1] ?? ($_GET['action'] ?? '');
$method = $_SERVER['REQUEST_METHOD'];

// Route aliasing for legacy admin.php calls
if ($resource === 'admin') {
    if ($action === 'stats') {
        $resource = 'reports';
    } elseif ($action === 'churches' || $action === 'create_church') {
        $resource = 'churches';
    } elseif ($action === 'songs') {
        $resource = 'songs';
    }
}

// Auth is the only public area
if ($resource === 'auth') {
    $controller = new \App\Controllers\AuthController();
    if ($action === 'login' && $method === 'POST') {
        $controller->login();
    }
    \App\Helpers\Response::error("Not Found", 404);
    exit;
}

// Protected area
try {
    $memberId = \App\Middleware\AuthMiddleware::handle();
} catch (\Exception $e) {
    \App\Helpers\Response::error($e->getMessage(), 401);
    exit;
}

switch ($resource) {
    case 'bootstrap':
        (new \App\Controllers\BootstrapController())->index($memberId);
        break;

    case 'churches':
        (new \App\Controllers\ChurchController())->handle($memberId, $action, $method);
        break;

    case 'areas':
        (new \App\Controllers\AreaController())->handle($memberId, $action, $method);
        break;

    case 'teams':
        (new \App\Controllers\TeamController())->handle($memberId, $action, $method);
        break;

    case 'people':
        (new \App\Controllers\PeopleController())->handle($memberId, $action, $method);
        break;

    case 'songs':
        (new \App\Controllers\SongController())->handle($memberId, $action, $method);
        break;

    case 'instruments':
        (new \App\Controllers\InstrumentController())->handle($memberId, $action, $method);
        break;

    case 'playlists':
        (new \App\Controllers\PlaylistController())->handle($memberId, $action, $method);
        break;

    case 'notifications':
        (new \App\Controllers\NotificationController())->handle($memberId, $action, $method);
        break;

    case 'activities':
        (new \App\Controllers\ActivityController())->handle($memberId, $action, $method);
        break;

    case 'reports':
        (new \App\Controllers\ReportController())->handle($memberId, $action, $method);
        break;

    case 'calendar':
        (new \App\Controllers\CalendarController())->handle($memberId, $action, $method);
        break;

    case 'roles':
        (new \App\Controllers\RoleController())->handle($memberId, $action, $method);
        break;

    default:
        \App\Helpers\Response::error("Resource not found: " . $resource, 404);
}
