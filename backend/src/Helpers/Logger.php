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

    public static function info($message, $context = [])
    {
        self::log("INFO", $message, $context);
    }

    public static function warning($message, $context = [])
    {
        self::log("WARNING", $message, $context);
    }

    public static function error($message, $context = [])
    {
        self::log("ERROR", $message, $context);
    }

    private static function log($level, $message, $context = [])
    {
        $logFile = self::getLogFile();

        // Rotation logic
        if (file_exists($logFile) && filesize($logFile) > 5 * 1024 * 1024) {
            @rename($logFile, $logFile . '.' . date('YmdHis'));
        }

        $date = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? " | Context: " . json_encode($context) : "";
        $formatted = "[$date] [$level] $message$contextStr" . PHP_EOL;
        @file_put_contents($logFile, $formatted, FILE_APPEND);
    }
}
