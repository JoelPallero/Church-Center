<?php
/**
 * Debug.php - Sistema de Logging y Debug Centralizado
 */

class Debug
{
    private static $logFile = __DIR__ . '/../../msm_debug.log';

    public static function log($message, $level = 'INFO')
    {
        $logDir = dirname(self::$logFile);
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0777, true);
        }

        if (!is_writable($logDir) && file_exists($logDir)) {
            return; // Cannot log
        }

        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] [$level] $message" . PHP_EOL;
        @file_put_contents(self::$logFile, $logMessage, FILE_APPEND);
    }

    /**
     * Log de Error específico
     */
    public static function error($message)
    {
        self::log($message, 'ERROR');
    }

    /**
     * Log de Seguridad (Logins, permisos)
     */
    public static function security($message)
    {
        self::log($message, 'SECURITY');
    }

    /**
     * Obtener las últimas líneas del log (para el "debug en vivo")
     */
    public static function getTail($lines = 50)
    {
        if (!file_exists(self::$logFile))
            return "No log file found.";

        $data = file(self::$logFile);
        $data = array_slice($data, -$lines);
        return implode("", $data);
    }
}
