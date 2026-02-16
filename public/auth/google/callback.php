<?php
/**
 * GOOGLE OAUTH CALLBACK (SERVER-SIDE HANDLER)
 * Implementation of Authorization Code Flow (Steps 1-8)
 */

// 1. Discovery of Auth Logic
$possiblePaths = [
    __DIR__ . '/../../../backend/src/Auth.php',
    __DIR__ . '/../../../../backend/src/Auth.php'
];

$logicPath = null;
foreach ($possiblePaths as $p) {
    if (file_exists($p)) {
        $logicPath = $p;
        break;
    }
}

if (!$logicPath) {
    die("Critical Error: Auth logic not found. Please check server paths.");
}

require_once $logicPath;
$auth = new Auth();

// Función de log para auditoría
function debug_log($msg)
{
    $log_file = __DIR__ . '/../../../msm_debug.log';
    $date = date('Y-m-d H:i:s');
    @file_put_contents($log_file, "[$date] GOOGLE_FLOW: $msg\n", FILE_APPEND);
}

// -------------------------------------------------------------------
// 1. RECIBO CODE (Paso 1 del usuario)
// -------------------------------------------------------------------
$code = $_GET['code'] ?? null;
$error = $_GET['error'] ?? null;
$mode = $_COOKIE['msm_google_mode'] ?? 'login';

// Limpiar cookie de estado
setcookie('msm_google_mode', '', time() - 3600, '/');

if ($error) {
    debug_log("Google devolvió un error: $error");
    header("Location: /login?error=" . urlencode("Google: $error"));
    exit();
}

if (!$code) {
    debug_log("Corte de flujo: No llegó el code en el GET.");
    header("Location: /login");
    exit();
}

debug_log("Code recibido. Iniciando intercambio para modo: $mode");

// -------------------------------------------------------------------
// 2 & 3. PIDO ACCESS_TOKEN Y OBTENGO PERFIL (Paso 2 y 3 del usuario)
// -------------------------------------------------------------------
$redirectUri = "https://musicservicemanager.net/auth/google/callback.php";
$exchange = $auth->exchangeCodeForToken($code, $redirectUri);

if (!$exchange['success']) {
    debug_log("Fallo en el intercambio: " . $exchange['error']);
    header("Location: /login?error=" . urlencode($exchange['error']));
    exit();
}

$profile = $exchange['profile'];
$email = $profile['email'];
$name = $profile['name'] ?? 'Usuario Google';

debug_log("Perfil obtenido con éxito: $email");

// -------------------------------------------------------------------
// 4, 5 & 6. BUSCO EN DB / CREO USUARIO / CREO JWT (Paso 4, 5 y 6 del usuario)
// -------------------------------------------------------------------
// Reutilizamos la lógica de googleLogin de la clase Auth, pero ahora pasamos el email verificado
// Opcional: Podríamos refactorizar Auth.php para tener un login directo por Email verificado.

// Por ahora, simulamos el login manual para obtener el token final
$sql = "SELECT id FROM user_accounts WHERE email = :email AND is_active = TRUE";
$stmt = $auth->getDb()->prepare($sql);
$stmt->execute([':email' => $email]);
$user = $stmt->fetch();

if (!$user) {
    debug_log("Usuario nuevo detectado ($email). Registrando como Guest automático...");
    $regResult = $auth->selfRegisterGuest($name, $email);
    if (!$regResult['success']) {
        debug_log("Error creando cuenta automática: " . $regResult['error']);
        header("Location: /login?error=" . urlencode($regResult['error'] ?? 'Error al registrarse'));
        exit();
    }
}

// Generamos el login final (ya sea porque existía o porque lo acabamos de crear)
// Usamos un dummy payload o el método googleLogin si lo adaptamos.
// Para este flujo, invocamos un login por email directo.
$finalAuth = $auth->googleLoginByEmail($email); // Vamos a crear este método en Auth.php

if ($finalAuth['success']) {
    // -------------------------------------------------------------------
    // 7 & 8. SETEO TOKEN Y REDIRIJO (Paso 7 y 8 del usuario)
    // -------------------------------------------------------------------
    debug_log("Autenticación final exitosa para $email. Redirigiendo a Dashboard.");
    header("Location: /auth/google/callback?token=" . $finalAuth['token']);
} else {
    debug_log("Error en la fase final de sesión: " . $finalAuth['error']);
    header("Location: /login?error=" . urlencode($finalAuth['error']));
}
exit();
?>