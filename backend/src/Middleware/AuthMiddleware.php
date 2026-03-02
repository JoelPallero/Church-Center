<?php

namespace App\Middleware;

use App\Jwt;
use App\Helpers\Response;

class AuthMiddleware
{
    public static function handle()
    {
        $authHeader = '';
        $headers = getallheaders();

        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (isset($_GET['token'])) {
            // Support URL-based token for SSE / EventSource
            $authHeader = 'Bearer ' . $_GET['token'];
        }

        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            error_log("AuthMiddleware: Token missing or malformed. Header: " . substr($authHeader, 0, 20) . "...");
            return Response::error("Unauthorized: Token missing", 401);
        }

        $token = $matches[1];
        $decoded = Jwt::decode($token);

        if (!$decoded) {
            error_log("AuthMiddleware: Invalid or expired token. Token start: " . substr($token, 0, 10) . "...");
            return Response::error("Unauthorized: Invalid or expired token", 401);
        }

        return $decoded['uid'];
    }
}
