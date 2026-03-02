<?php

namespace App;

use PDO;
use PDOException;
use App\Helpers\Logger;

class Database
{
    private static $instances = [];
    private static $cachedEnv = null;
    private $conn;

    private function __construct($configKey = 'main')
    {
        if (self::$cachedEnv === null) {
            $configPath = APP_ROOT . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'database.env';

            if (!file_exists($configPath)) {
                Logger::error("Database Configuration file not found at: " . $configPath);
                throw new \Exception("Database configuration missing.");
            }

            self::$cachedEnv = parse_ini_file($configPath);
        }

        $env = self::$cachedEnv;

        $host = '';
        $user = '';
        $pass = '';
        $name = '';
        $port = '3306';

        if ($configKey === 'main') {
            $host = $env['DB_HOST'] ?? '';
            $user = $env['DB_USER'] ?? '';
            $pass = $env['DB_PASS'] ?? '';
            $name = $env['DB_NAME'] ?? '';
            $port = $env['DB_PORT'] ?? '3306';
        } elseif ($configKey === 'music') {
            $host = $env['MUSIC_DB_HOST'] ?? '';
            $user = $env['MUSIC_DB_USER'] ?? '';
            $pass = $env['MUSIC_DB_PASS'] ?? '';
            $name = $env['MUSIC_DB_NAME'] ?? '';
            // Music DB might not have a port specified, default to 3306
            $port = $env['DB_PORT'] ?? '3306';
        }

        if (empty($host) || empty($user) || empty($name)) {
            Logger::error("Database Configuration is missing required keys for: $configKey");
            throw new \Exception("Database configuration malformed for $configKey.");
        }

        try {
            $dsn = "mysql:host=$host;port=$port;dbname=$name;charset=utf8mb4";
            $this->conn = new PDO($dsn, $user, $pass);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            Logger::error("Database Connection Error ($configKey): " . $e->getMessage() . " (User: $user)");
            throw new \Exception("Database connection failed for $configKey.");
        }
    }

    public static function getInstance($configKey = 'main')
    {
        if (!isset(self::$instances[$configKey])) {
            self::$instances[$configKey] = new self($configKey);
        }
        return self::$instances[$configKey]->conn;
    }
}
