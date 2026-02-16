<?php
/**
 * EmailManager.php - Gestión de envíos SMTP (Hostinger)
 * Requiere PHPMailer. Instrucciones:
 * 1. Descargar PHPMailer desde GitHub (https://github.com/PHPMailer/PHPMailer)
 * 2. Copiar los archivos en backend/src/libs/PHPMailer/
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

require_once __DIR__ . '/Debug.php';

// Intentar cargar PHPMailer
$phpMailerPath = __DIR__ . '/libs/PHPMailer/src/';
if (file_exists($phpMailerPath . 'PHPMailer.php')) {
    require $phpMailerPath . 'Exception.php';
    require $phpMailerPath . 'PHPMailer.php';
    require $phpMailerPath . 'SMTP.php';
}

class EmailManager
{
    private $host = 'smtp.hostinger.com';
    private $port = 465; // SSL
    private $username = 'no-replay@musicservicemanager.net';
    private $password;
    private $fromEmail = 'no-replay@musicservicemanager.net';
    private $fromName = 'Church Management Solution';

    public function __construct()
    {
        $this->password = Database::getInstance()->getConfig('SMTP_PASS') ?? 'GHF5L@Q4GU9mVSY';
    }

    public function sendInvitation($toEmail, $toName, $roleName, $inviteUrl, $churchName = 'Tu Iglesia')
    {
        $templatePath = __DIR__ . '/../templates/invitation.html';
        if (!file_exists($templatePath)) {
            Debug::error("Email Template not found at $templatePath");
            return false;
        }

        $html = file_get_contents($templatePath);

        // Reemplazar placeholders
        $replacements = [
            '{{CHURCH_NAME}}' => $churchName,
            '{{USER_NAME}}' => $toName,
            '{{ROLE_NAME}}' => $roleName,
            '{{ROLE_LOWER}}' => strtolower($roleName),
            '{{INVITE_URL}}' => $inviteUrl
        ];

        foreach ($replacements as $key => $value) {
            $html = str_replace($key, $value, $html);
        }

        $subject = "Has sido invitado al equipo de " . $churchName;

        return $this->sendSMTP($toEmail, $toName, $subject, $html);
    }

    public function sendPasswordReset($toEmail, $toName, $resetUrl)
    {
        $subject = "Restablecer tu contraseña";
        $html = "
        <div style='font-family: sans-serif; padding: 20px; color: #333;'>
            <h2>Hola $toName,</h2>
            <p>Has solicitado restablecer tu contraseña para acceder a la plataforma.</p>
            <p>Haz clic en el siguiente botón para continuar. Este enlace expirará en 24 horas.</p>
            <div style='margin: 30px 0;'>
                <a href='$resetUrl' style='background-color: #3B82F6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;'>Restablecer Contraseña</a>
            </div>
            <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
            <hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;'>
            <p style='font-size: 12px; color: #666;'>Si tienes problemas con el botón, copia y pega este enlace en tu navegador:</p>
            <p style='font-size: 12px; color: #666;'>$resetUrl</p>
        </div>
        ";

        return $this->sendSMTP($toEmail, $toName, $subject, $html);
    }

    public function sendTeamAssignment($toEmail, $toName, $teamName, $churchName = 'Tu Iglesia')
    {
        $templatePath = __DIR__ . '/../templates/invitation_registered.html';
        if (!file_exists($templatePath)) {
            Debug::error("Email Template not found at $templatePath");
            return false;
        }

        $html = file_get_contents($templatePath);

        // Reemplazar placeholders
        $replacements = [
            '{{CHURCH_NAME}}' => $churchName,
            '{{USER_NAME}}' => $toName,
            '{{TEAM_NAME}}' => $teamName,
            '{{APP_URL}}' => $this->getBaseUrl()
        ];

        foreach ($replacements as $key => $value) {
            $html = str_replace($key, $value, $html);
        }

        $subject = "Nueva asignación de equipo en " . $churchName;

        return $this->sendSMTP($toEmail, $toName, $subject, $html);
    }

    private function getBaseUrl()
    {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        if (isset($_SERVER['HTTP_X_FORWARDED_HOST'])) {
            $host = $_SERVER['HTTP_X_FORWARDED_HOST'];
        }
        return $protocol . $host;
    }

    /**
     * Motor de envío SMTP usando PHPMailer
     */
    private function sendSMTP($toEmail, $toName, $subject, $bodyHTML)
    {
        Debug::log("EMAIL_SEND_ATTEMPT | To: $toEmail | PHPMailerPresent: " . (class_exists('PHPMailer\PHPMailer\PHPMailer') ? 'YES' : 'NO'));
        if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
            Debug::error("EMAIL_LIBRARY_MISSING | PHPMailer not found in backend/src/libs/PHPMailer/src/. Falling back to native mail().");

            // Fallback to PHP native mail()
            $headers = "MIME-Version: 1.0" . "\r\n";
            $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
            $headers .= "From: <" . $this->fromEmail . ">" . "\r\n";

            $sent = mail($toEmail, $subject, $bodyHTML, $headers);
            if ($sent) {
                Debug::log("EMAIL_FALLBACK_SUCCESS | Sent via mail() to $toEmail. Warning: SPF might fail.");
                return true;
            } else {
                Debug::error("EMAIL_FALLBACK_FAILED | Native mail() failed for $toEmail.");
                return false;
            }
        }

        $mail = new PHPMailer(true);

        try {
            // Server settings
            $mail->isSMTP();
            $mail->Host = $this->host;
            $mail->SMTPAuth = true;
            $mail->Username = $this->username;
            $mail->Password = $this->password;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port = $this->port;
            $mail->CharSet = 'UTF-8';
            Debug::log("EMAIL_INIT | SMTP Configured for {$this->host}:{$this->port}");

            // Recipients
            $mail->setFrom($this->fromEmail, $this->fromName);
            $mail->addAddress($toEmail, $toName);
            $mail->addReplyTo($this->fromEmail, $this->fromName);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $bodyHTML;
            $mail->AltBody = strip_tags($bodyHTML);

            $mail->send();
            Debug::log("EMAIL_SEND_SUCCESS | To: $toEmail | Subject: $subject");
            return true;
        } catch (Exception $e) {
            Debug::error("EMAIL_SEND_FAILED | To: $toEmail | PHPMailer Error: " . $mail->ErrorInfo . " | Exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Sistema de Logs interno - Marcado como obsoleto, usar Debug::log
     */
    private function log($message)
    {
        Debug::log($message);
    }
}
