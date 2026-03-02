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
        error_log("AuthController::login called");
        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput, true);
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        $recaptchaToken = $data['recaptchaToken'] ?? '';

        // reCAPTCHA disabled temporarily

        Logger::info("--- AUTH ATTEMPT START ---");
        Logger::info("Email: $email");
        Logger::info("Input Data Keys: " . implode(', ', array_keys($data ?? [])));

        if (empty($email) || empty($password)) {
            Logger::error("Auth failed: Missing credentials.");
            return Response::error("El correo y la contraseña son obligatorios", 400);
        }

        Logger::info("Querying UserRepo::findByEmail...");
        try {
            $user = UserRepo::findByEmail($email);
        } catch (\Exception $e) {
            Logger::error("DB Exception in findByEmail: " . $e->getMessage());
            return Response::error("Error interno del servidor", 500);
        }

        if (!$user) {
            Logger::info("Auth failed: User not found in DB or is_active != 1");
            return Response::error("Credenciales inválidas", 401);
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
            return Response::error("Credenciales inválidas", 401);
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

    public function googleCallback()
    {
        $code = $_GET['code'] ?? null;
        $error = $_GET['error'] ?? null;

        if ($error) {
            header("Location: /login?error=" . urlencode("Google: $error"));
            exit();
        }

        if (!$code) {
            header("Location: /login");
            exit();
        }

        $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
        $redirectUri = "$protocol://" . $_SERVER['HTTP_HOST'] . "/api/auth/google/callback";
        $exchange = $this->exchangeCodeForToken($code, $redirectUri);

        if (!$exchange['success']) {
            header("Location: /login?error=" . urlencode($exchange['error']));
            exit();
        }

        $email = $exchange['profile']['email'];

        // Find user by email
        $user = UserRepo::findByEmail($email);

        if (!$user) {
            header("Location: /login?error=" . urlencode("Usuario no encontrado o inactivo. Por favor, contacte a un administrador."));
            exit();
        }

        $payload = [
            'uid' => $user['member_id'],
            'email' => $user['email'],
            'iat' => time(),
            'exp' => time() + 3600
        ];

        $token = Jwt::encode($payload);

        header("Location: /auth/google/callback?token=" . $token);
        exit();
    }

    private function exchangeCodeForToken($code, $redirectUri)
    {
        // Load config
        $configPath = APP_ROOT . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'database.env';
        $env = parse_ini_file($configPath);
        $clientId = $env['GOOGLE_CLIENT_ID'] ?? '';
        $clientSecret = $env['GOOGLE_CLIENT_SECRET'] ?? '';

        // 1. Exchange CODE for Access Token
        $ch = curl_init("https://oauth2.googleapis.com/token");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'code' => $code,
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'redirect_uri' => $redirectUri,
            'grant_type' => 'authorization_code'
        ]));

        $response = curl_exec($ch);
        curl_close($ch);
        $tokenData = json_decode($response, true);

        if (isset($tokenData['error'])) {
            return ['success' => false, 'error' => 'Exchange failed: ' . ($tokenData['error_description'] ?? $tokenData['error'])];
        }

        // 2. Get User Profile
        $accessToken = $tokenData['access_token'];
        $ch = curl_init("https://www.googleapis.com/oauth2/v3/userinfo");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $accessToken"]);
        $profileResponse = curl_exec($ch);
        curl_close($ch);

        $profile = json_decode($profileResponse, true);

        if (!$profile || !isset($profile['email'])) {
            return ['success' => false, 'error' => 'Failed to fetch profile'];
        }

        return ['success' => true, 'profile' => $profile];
    }

    public function verifyInvitation()
    {
        $token = $_GET['token'] ?? '';
        if (empty($token)) {
            return Response::error("Falta el token de invitación", 400);
        }

        $invitation = \App\Repositories\UserRepo::findByInviteToken($token);
        if (!$invitation) {
            return Response::error("La invitación es inválida o ha expirado", 400);
        }

        return Response::json([
            'success' => true,
            'invitation' => [
                'name' => $invitation['name'],
                'email' => $invitation['email'],
                'church' => $invitation['church_name'] ?? 'Tu Iglesia'
            ]
        ]);
    }

    public function acceptInvitation()
    {
        $data = json_decode(file_get_contents("php://input"), true);
        $token = $data['token'] ?? '';
        $password = $data['password'] ?? '';

        if (empty($token) || empty($password)) {
            return Response::error("Token y contraseña son obligatorios", 400);
        }

        $invitation = \App\Repositories\UserRepo::findByInviteToken($token);
        if (!$invitation) {
            return Response::error("La invitación es inválida o ha expirado", 400);
        }

        $success = \App\Repositories\UserRepo::completeInvitation($invitation['id'], $password);

        if ($success) {
            // Generate token for auto-login
            $payload = [
                'uid' => $invitation['id'],
                'email' => $invitation['email'],
                'iat' => time(),
                'exp' => time() + 3600
            ];
            $token = \App\Jwt::encode($payload);

            return Response::json([
                'success' => true,
                'token' => $token,
                'user' => [
                    'id' => $invitation['id'],
                    'email' => $invitation['email']
                ]
            ]);
        }

        return Response::error("No se pudo completar el registro", 500);
    }


    private function verifyRecaptcha($token)
    {
        if (empty($token))
            return false;

        $configPath = APP_ROOT . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'database.env';
        if (!file_exists($configPath))
            return true;

        $env = parse_ini_file($configPath);
        $secret = $env['RECAPTCHA_SECRET_KEY'] ?? '';

        if (empty($secret))
            return true;

        $url = 'https://www.google.com/recaptcha/api/siteverify';
        $data = [
            'secret' => $secret,
            'response' => $token
        ];

        $options = [
            'http' => [
                'header' => "Content-type: application/x-www-form-urlencoded\r\n",
                'method' => 'POST',
                'content' => http_build_query($data)
            ]
        ];

        $context = stream_context_create($options);
        $result = @file_get_contents($url, false, $context);
        if ($result === false)
            return true;

        $response = json_decode($result, true);
        return $response['success'] && ($response['score'] ?? 1.0) >= 0.5;
    }
}
