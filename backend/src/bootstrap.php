<?php

// Define project root as the parent of src/
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

// Autoloader manual simple
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

// Global Exception Handler
set_exception_handler(function ($e) {
    $msg = "Uncaught Exception: " . $e->getMessage() . "\n" .
        "File: " . $e->getFile() . ":" . $e->getLine() . "\n" .
        "Stack trace:\n" . $e->getTraceAsString();
    \App\Helpers\Logger::error($msg);
    \App\Helpers\Response::error("Internal Server Error: " . $e->getMessage(), 500);
});

// Initialize CORS
\App\Helpers\Cors::init();