<?php

namespace App\Helpers;

use App\Helpers\Logger;

class MailHelper
{
    private static $config = null;

    private static function init()
    {
        if (self::$config === null) {
            $configPath = APP_ROOT . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'database.env';
            if (file_exists($configPath)) {
                self::$config = parse_ini_file($configPath);
            } else {
                self::$config = [];
            }
        }
    }

    public static function sendInvitation($toEmail, $toName, $roleName, $churchName = 'Tu Iglesia', $churchId = null, $inviteToken = null)
    {
        self::init();

        $html = '';
        $subject = "Invitación a formar parte de " . $churchName;

        // Try to get custom template from DB first
        if ($churchId) {
            $customTemplate = \App\Repositories\InvitationTemplateRepo::getActive($churchId);
            if ($customTemplate) {
                $html = $customTemplate['body_html'];
                $subject = $customTemplate['subject'];
            }
        }

        // Fallback to file if no custom template
        if (empty($html)) {
            $templatePath = APP_ROOT . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'templates' . DIRECTORY_SEPARATOR . 'invitation.html';
            if (!file_exists($templatePath)) {
                Logger::error("MailHelper: Template not found at $templatePath");
                return false;
            }
            $html = file_get_contents($templatePath);
        }

        // Base URL for invite link
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
        $host = $_SERVER['HTTP_HOST'] ?? 'musicservicemanager.net';
        $inviteUrl = $protocol . $host . "/accept-invite?token=" . ($inviteToken ?? '');

        // Replacements
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

        $subject = "Invitación a formar parte de " . $churchName;
        $from = self::$config['SMTP_USER'] ?? 'no-replay@musicservicemanager.net';

        // Headers for HTML mail
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: Church Management <" . $from . ">" . "\r\n";

        try {
            // Attempt native mail() - Hostinger usually handles this well
            $sent = mail($toEmail, $subject, $html, $headers);
            if ($sent) {
                Logger::info("MailHelper: Invitation sent successfully to $toEmail");
                return true;
            } else {
                Logger::error("MailHelper: Native mail() failed for $toEmail");
                return false;
            }
        } catch (\Exception $e) {
            Logger::error("MailHelper Error: " . $e->getMessage());
            return false;
        }
    }
}
