<?php

namespace App\Repositories;

use App\Database;
use PDO;

class InvitationTemplateRepo
{
    /**
     * Get all templates for a church
     */
    public static function getByChurch($churchId)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                SELECT * FROM invitation_templates 
                WHERE church_id = ? 
                ORDER BY template_index ASC
            ");
            $stmt->execute([$churchId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("InvitationTemplateRepo::getByChurch error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get the active template for a church
     */
    public static function getActive($churchId)
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                SELECT * FROM invitation_templates 
                WHERE church_id = ? AND is_active = 1 
                LIMIT 1
            ");
            $stmt->execute([$churchId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("InvitationTemplateRepo::getActive error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Save/Update a template
     */
    public static function save($churchId, $index, $data)
    {
        try {
            $db = Database::getInstance();

            // If setting this one to active, deactivate others
            if (!empty($data['is_active'])) {
                $stmt = $db->prepare("UPDATE invitation_templates SET is_active = 0 WHERE church_id = ?");
                $stmt->execute([$churchId]);
            }

            $stmt = $db->prepare("
                INSERT INTO invitation_templates (church_id, template_index, is_active, subject, body_html)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    is_active = VALUES(is_active),
                    subject = VALUES(subject),
                    body_html = VALUES(body_html)
            ");

            return $stmt->execute([
                $churchId,
                $index,
                $data['is_active'] ? 1 : 0,
                $data['subject'],
                $data['body_html']
            ]);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("InvitationTemplateRepo::save error: " . $e->getMessage());
            return false;
        }
    }
}
