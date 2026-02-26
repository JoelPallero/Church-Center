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
        }

        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return Response::error("Unauthorized: Token missing", 401);
        }

        $token = $matches[1];
        $decoded = Jwt::decode($token);

        if (!$decoded) {
            return Response::error("Unauthorized: Invalid or expired token", 401);
        }

        return $decoded['uid'];
    }
}
