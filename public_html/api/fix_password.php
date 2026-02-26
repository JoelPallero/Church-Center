<?php
/**
 * Herramienta de Reparación de Password para MSM2
 * Úsala para generar un hash correcto y actualizar la DB si es necesario.
 */

$password = 'Master2026!';
$hash = password_hash($password, PASSWORD_BCRYPT);

echo "Password: $password\n";
echo "Hash generado: $hash\n\n";

echo "--- INSTRUCCIONES PHPMYADMIN ---\n";
echo "Si el login sigue fallando, ejecuta este SQL en phpMyAdmin:\n\n";
echo "UPDATE user_accounts SET password_hash = '$hash' WHERE email = 'admin@system.master';\n\n";

echo "--- VERIFICACIÓN LOCAL ---\n";
require_once __DIR__ . '/../../backend/src/bootstrap.php';
try {
    $db = \App\Database::getInstance();
    $stmt = $db->prepare("SELECT password_hash FROM user_accounts WHERE email = 'admin@system.master'");
    $stmt->execute();
    $row = $stmt->fetch();

    if ($row) {
        $db_hash = $row['password_hash'];
        echo "Hash actual en DB: $db_hash\n";
        $verify = password_verify($password, $db_hash);
        echo "Verificación con DB actual: " . ($verify ? "CORRECTA ✅" : "FALLIDA ❌") . "\n";

        if (!$verify) {
            echo "\nReparando hash directamente en la DB...\n";
            $update = $db->prepare("UPDATE user_accounts SET password_hash = ? WHERE email = 'admin@system.master'");
            $update->execute([$hash]);
            echo "Reparación completada. Intenta loguearte ahora.\n";
        }
    } else {
        echo "ERROR: El usuario admin@system.master no existe en la base de datos.\n";
        echo "Ejecuta el script SQL de seeds para crearlo.\n";
    }
} catch (Exception $e) {
    echo "Error de conexión: " . $e->getMessage() . "\n";
}
