<?php

namespace App\Controllers;

use App\Repositories\UserRepo;
use App\Jwt;
use App\Helpers\Response;
use App\Helpers\Logger;

class AuthController
{
    public function login()
    {
        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput, true);
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        Logger::info("--- AUTH ATTEMPT START ---");
        Logger::info("Email: $email");
        Logger::info("Input Data Keys: " . implode(', ', array_keys($data ?? [])));

        if (empty($email) || empty($password)) {
            Logger::error("Auth failed: Missing credentials.");
            return Response::error("Email and password are required", 400);
        }

        Logger::info("Querying UserRepo::findByEmail...");
        try {
            $user = UserRepo::findByEmail($email);
        } catch (\Exception $e) {
            Logger::error("DB Exception in findByEmail: " . $e->getMessage());
            return Response::error("Internal Server Error", 500);
        }

        if (!$user) {
            Logger::info("Auth failed: User not found in DB or is_active != 1");
            return Response::error("Invalid credentials", 401);
        }

        // DETAILED PASSWORD AUDIT
        $storedHash = $user['password_hash'];
        $providedPassLen = strlen($password);
        $storedHashLen = strlen($storedHash);

        $hashInfo = password_get_info($storedHash);
        $verify = password_verify($password, $storedHash);

        Logger::info("Password Verification Audit:");
        Logger::info("- Provided Password Length: $providedPassLen");
        Logger::info("- Stored Hash Length: $storedHashLen");
        Logger::info("- Stored Hash Start: " . substr($storedHash, 0, 7) . "...");
        Logger::info("- Hash Info (Algo Name): " . ($hashInfo['algoName'] ?? 'unknown'));
        Logger::info("- Verify Result: " . ($verify ? "SUCCESS" : "FAILURE"));

        // Check for common encoding issues
        if (!$verify) {
            // Check if perhaps there's an encoding mismatch or hidden chars
            Logger::info("Failure analysis: Checking for hidden characters...");
            if (trim($password) !== $password) {
                Logger::info("! WARNING: Provided password has whitespace at edges.");
            }
            if (bin2hex($password) !== bin2hex(trim($password))) {
                Logger::info("! Raw hex provided pass: " . bin2hex($password));
            }

            // Log environment info that could affect hashing
            Logger::info("System Environment Info:");
            Logger::info("- PHP Version: " . PHP_VERSION);
            Logger::info("- Default Password Algo: " . password_hash("test", PASSWORD_DEFAULT));
        }

        if (!$verify) {
            Logger::error("Auth failed: Incorrect password for ($email)");
            return Response::error("Invalid credentials", 401);
        }

        Logger::info("Auth success: User ($email) authenticated.");

        $payload = [
            'uid' => $user['member_id'],
            'email' => $user['email'],
            'iat' => time(),
            'exp' => time() + 3600
        ];

        $token = Jwt::encode($payload);

        return Response::json([
            'success' => true,
            'access_token' => $token,
            'expires_in' => 3600
        ]);
    }
}
