<?php

namespace App\Helpers;

class Logger
{
    private static function getLogFile()
    {
        $dir = APP_ROOT . DIRECTORY_SEPARATOR . 'logs';
        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }

        $file = $dir . DIRECTORY_SEPARATOR . 'app.log';
        if (is_writable($dir) || (!file_exists($file) && is_writable($dir))) {
            return $file;
        }

        // Fallback to system temp dir if project log dir is not writable
        return sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'msm2_fallback.log';
    }

    public static function info($message)
    {
        self::log("INFO", $message);
    }

    public static function warning($message)
    {
        self::log("WARNING", $message);
    }

    public static function error($message)
    {
        self::log("ERROR", $message);
    }

    private static function log($level, $message)
    {
        $logFile = self::getLogFile();

        // Rotation logic
        if (file_exists($logFile) && filesize($logFile) > 5 * 1024 * 1024) {
            @rename($logFile, $logFile . '.' . date('YmdHis'));
        }

        $date = date('Y-m-d H:i:s');
        $formatted = "[$date] [$level] $message" . PHP_EOL;
        @file_put_contents($logFile, $formatted, FILE_APPEND);
    }
}
