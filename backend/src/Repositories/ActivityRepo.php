<?php

namespace App\Repositories;

use App\Database;
use PDO;

class ActivityRepo
{
    /**
     * Log a new activity
     */
    public static function log($churchId, $memberId, $action, $entityType, $entityId = null, $details = [])
    {
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                INSERT INTO activity_log (church_id, member_id, action, entity_type, entity_id, details)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            return $stmt->execute([
                $churchId,
                $memberId,
                $action,
                $entityType,
                $entityId,
                json_encode($details)
            ]);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("ActivityRepo::log error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get recent activities for a church
     */
    public static function getRecent($churchId, $limit = 20)
    {
        try {
            $db = Database::getInstance();
            $sql = "
                SELECT al.*, m.name as member_name, m.surname as member_surname
                FROM activity_log al
                JOIN member m ON al.member_id = m.id
            ";
            $params = [];

            if ($churchId) {
                $sql .= " WHERE al.church_id = ?";
                $params[] = $churchId;
            }

            $limitInt = (int) $limit;
            $sql .= " ORDER BY al.created_at DESC LIMIT $limitInt";

            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Decode details
            foreach ($activities as &$activity) {
                $activity['details'] = json_decode($activity['details'], true);
                $activity['user_name'] = $activity['member_name'] . ($activity['member_surname'] ? ' ' . $activity['member_surname'] : '');

                // Format for frontend (ActivityStream expects message, time, icon)
                $activity['message'] = self::formatMessage($activity);
                $activity['time'] = $activity['created_at'];
                $activity['icon'] = self::getIcon($activity['entity_type']);
            }

            return $activities;
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("ActivityRepo::getRecent error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get activities newer than a specific ID
     */
    public static function getNewerThan($lastId, $churchId = null)
    {
        try {
            $db = Database::getInstance();
            $sql = "
                SELECT al.*, m.name as member_name, m.surname as member_surname
                FROM activity_log al
                JOIN member m ON al.member_id = m.id
                WHERE al.id > ?
            ";
            $params = [(int) $lastId];

            if ($churchId) {
                $sql .= " AND al.church_id = ?";
                $params[] = $churchId;
            }

            $sql .= " ORDER BY al.id ASC";

            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($activities as &$activity) {
                $activity['user_name'] = $activity['member_name'] . ($activity['member_surname'] ? ' ' . $activity['member_surname'] : '');
                $activity['details'] = json_decode($activity['details'], true);
                $activity['message'] = self::formatMessage($activity);
            }

            return $activities;
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("ActivityRepo::getNewerThan error: " . $e->getMessage());
            return [];
        }
    }

    private static function formatMessage($activity)
    {
        $actor = $activity['user_name'];
        $details = $activity['details'] ?? [];
        $name = $details['name'] ?? 'el elemento';

        switch ($activity['action']) {
            case 'created':
                return "$actor creó " . self::translateEntity($activity['entity_type']) . ": $name";
            case 'invited':
                return "$actor invitó a un nuevo integrante: $name";
            case 'approved':
                return "$actor autorizó a $name";
            case 'assigned':
                return "$actor asignó a " . ($details['target_name'] ?? 'un integrante') . " en " . ($details['meeting_title'] ?? 'una reunión');
            case 'updated':
                return "$actor actualizó " . self::translateEntity($activity['entity_type']) . ": $name";
            default:
                return "$actor realizó una acción en " . self::translateEntity($activity['entity_type']);
        }
    }

    private static function translateEntity($type)
    {
        $map = [
            'area' => 'el área',
            'team' => 'el equipo',
            'member' => 'el miembro',
            'meeting' => 'la reunión',
            'playlist' => 'el listado',
            'instrument' => 'los instrumentos',
            'song' => 'la canción',
            'invitation' => 'la invitación',
            'template' => 'la plantilla'
        ];
        return $map[$type] ?? $type;
    }

    private static function getIcon($type)
    {
        $map = [
            'area' => 'layers',
            'team' => 'groups',
            'member' => 'person_add',
            'meeting' => 'calendar_today',
            'playlist' => 'queue_music'
        ];
        return $map[$type] ?? 'bolt';
    }
}
