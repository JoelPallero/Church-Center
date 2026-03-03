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

        if (!empty($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
        } elseif (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (!empty($_GET['token'])) {
            // Support URL-based token for SSE / EventSource
            $authHeader = 'Bearer ' . $_GET['token'];
        } elseif (!empty($_SERVER['QUERY_STRING'])) {
            parse_str($_SERVER['QUERY_STRING'], $query);
            if (!empty($query['token'])) {
                $authHeader = 'Bearer ' . $query['token'];
            }
        }

        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            throw new \Exception("Token missing", 401);
        }

        $token = $matches[1];
        $decoded = Jwt::decode($token);

        if (!$decoded) {
            \App\Helpers\Logger::error("AuthMiddleware: Invalid token");
            throw new \Exception("Unauthorized", 401);
        }

        // Return standardized Auth payload
        return [
            'uid' => $decoded['uid'],
            'email' => $decoded['email'],
            // Future: we might want to fetch the current role from DB if JWT is stale
            // For now, we expect the payload to be trusted
            'role' => $decoded['role'] ?? 'member'
        ];
    }
}
