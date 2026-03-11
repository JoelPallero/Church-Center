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
            }
            else {
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

        // Base URL from config
        $baseUrl = self::$config['APP_URL'] ?? 'https://musicservicemanager.net';
        $inviteUrl = rtrim($baseUrl, '/') . "/accept-invite?token=" . ($inviteToken ?? '');

        // Replacements
        $replacements = [
            '{{CHURCH_NAME}}' => $churchName,
            '{{USER_NAME}}' => $toName,
            '{{ROLE_NAME}}' => $roleName,
            '{{ROLE_LOWER}}' => strtolower($roleName),
            '{{INVITE_URL}}' => $inviteUrl,
            '{{YEAR}}' => date('Y')
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
            }
            else {
                Logger::error("MailHelper: Native mail() failed for $toEmail");
                return false;
            }
        }
        catch (\Exception $e) {
            Logger::error("MailHelper Error: " . $e->getMessage());
            return false;
        }
    }

    public static function sendSetlistNotification($leaderName, $meetingData, $songs, $recipients, $churchName = 'Tu Iglesia')
    {
        self::init();

        $templatePath = APP_ROOT . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'templates' . DIRECTORY_SEPARATOR . 'setlist_assignment.html';
        if (!file_exists($templatePath)) {
            Logger::error("MailHelper: Template not found at $templatePath");
            return false;
        }

        $baseHtml = file_get_contents($templatePath);
        $baseUrl = self::$config['APP_URL'] ?? 'https://musicservicemanager.net';

        // Format songs HTML
        $songsHtml = '';
        foreach ($songs as $song) {
            $songsHtml .= '
            <div class="song-item">
                <span class="song-key">' . ($song['original_key'] ?? 'N/A') . '</span>
                <div class="song-title">' . $song['title'] . '</div>
                <div class="song-artist">' . $song['artist'] . '</div>
            </div>';
        }

        // Parse date
        $date = $meetingData['start_at'] ?? $meetingData['instance_date'] ?? 'N/A';
        $formattedDate = 'N/A';
        if ($date !== 'N/A') {
            try {
                $dt = new \DateTime($date);
                $formattedDate = $dt->format('d/m/Y');
            } catch (\Exception $e) {}
        }

        $replacements = [
            '{{CHURCH_NAME}}' => $churchName,
            '{{LEADER_NAME}}' => $leaderName,
            '{{MEETING_TITLE}}' => $meetingData['title'] ?? 'Reunión',
            '{{MEETING_DATE}}' => $formattedDate,
            '{{MEETING_TIME}}' => $meetingData['start_time'] ?? 'N/A',
            '{{MEETING_LOCATION}}' => $meetingData['location'] ?? 'Auditorio Principal',
            '{{SONGS_HTML}}' => $songsHtml,
            '{{APP_URL}}' => rtrim($baseUrl, '/'),
            '{{YEAR}}' => date('Y')
        ];

        $html = $baseHtml;
        foreach ($replacements as $key => $value) {
            $html = str_replace($key, $value, $html);
        }

        $subject = "Nuevo Listado: " . ($meetingData['title'] ?? 'Reunión');
        $from = self::$config['SMTP_USER'] ?? 'no-replay@musicservicemanager.net';

        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: Church Management <" . $from . ">" . "\r\n";

        $successCount = 0;
        foreach ($recipients as $recipient) {
            if (empty($recipient['email'])) continue;
            
            if (@mail($recipient['email'], $subject, $html, $headers)) {
                $successCount++;
            }
        }

        Logger::info("MailHelper: Sent $successCount notifications for new setlist.");
        return $successCount > 0;
    }
}
