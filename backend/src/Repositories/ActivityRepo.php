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
                SELECT al.*, m.name as member_name, m.surname as member_surname, c.name as church_name
                FROM activity_log al
                JOIN member m ON al.member_id = m.id
                LEFT JOIN church c ON al.church_id = c.id
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

            // Process for frontend
            foreach ($activities as &$activity) {
                $activity['details'] = json_decode($activity['details'], true) ?? [];
                $activity['new_values'] = $activity['details'];
                $activity['user_name'] = $activity['member_name'] . ($activity['member_surname'] ? ' ' . $activity['member_surname'] : '');

                // Store raw action for formatting
                $rawAction = $activity['action'];

                // Prepare translation key for frontend (preserving entity prefix)
                $action = $activity['action'];
                if (strpos($action, '.') === false && strpos($action, '_') === false) {
                    $map = ['create' => 'created', 'invite' => 'invited', 'update' => 'updated'];
                    $action = $map[$action] ?? $action;
                    $activity['action'] = $activity['entity_type'] . '_' . $action;
                }

                $activity['message'] = self::formatMessage($activity, $rawAction);
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
                SELECT al.*, m.name as member_name, m.surname as member_surname, c.name as church_name
                FROM activity_log al
                JOIN member m ON al.member_id = m.id
                LEFT JOIN church c ON al.church_id = c.id
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
                $activity['details'] = json_decode($activity['details'], true) ?? [];
                $activity['new_values'] = $activity['details'];
                $activity['user_name'] = $activity['member_name'] . ($activity['member_surname'] ? ' ' . $activity['member_surname'] : '');

                // Store raw action for formatting
                $rawAction = $activity['action'];

                // Prepare translation key for frontend
                $action = $activity['action'];
                if (strpos($action, '.') === false && strpos($action, '_') === false) {
                    $map = ['create' => 'created', 'invite' => 'invited', 'update' => 'updated'];
                    $action = $map[$action] ?? $action;
                    $activity['action'] = $activity['entity_type'] . '_' . $action;
                }

                $activity['message'] = self::formatMessage($activity, $rawAction);
            }

            return $activities;
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("ActivityRepo::getNewerThan error: " . $e->getMessage());
            return [];
        }
    }

    private static function formatMessage($activity, $overrideAction = null)
    {
        $actor = $activity['user_name'] ?? 'Usuario';
        $church = $activity['church_name'] ?? '';
        $details = $activity['details'] ?? [];
        $name = $details['name'] ?? $details['title'] ?? 'el elemento';

        $action = $overrideAction ?? $activity['action'];

        // Strip entity prefix if present (e.g., team_created -> created)
        if (strpos($action, '_') !== false) {
            $parts = explode('_', $action);
            $action = end($parts);
        }

        $churchSuffix = $church ? " en ($church)" : "";

        switch ($action) {
            case 'create':
            case 'created':
                return "Usuario: $actor | Acción: Alta de " . self::translateEntity($activity['entity_type'], false) . ": $name" . $churchSuffix;
            case 'invite':
            case 'invited':
                return "Usuario: $actor | Acción: Invitación a: $name" . $churchSuffix;
            case 'approved':
                return "Usuario: $actor | Acción: Autorizó a $name" . $churchSuffix;
            case 'assigned':
                $target = $details['target_name'] ?? 'un integrante';
                $meeting = $details['meeting_title'] ?? 'una reunión';
                return "Usuario: $actor | Acción: Asignó a $target en reunión: $meeting" . $churchSuffix;
            case 'update':
            case 'updated':
                return "Usuario: $actor | Acción: Actualización de " . self::translateEntity($activity['entity_type'], false) . ": $name" . $churchSuffix;
            case 'delete':
            case 'deleted':
                return "Usuario: $actor | Acción: Baja de " . self::translateEntity($activity['entity_type'], false) . ": $name" . $churchSuffix;
            default:
                return "Usuario: $actor | Acción: Realizó $action en " . self::translateEntity($activity['entity_type'], false) . $churchSuffix;
        }
    }

    private static function translateEntity($type, $withArticle = true)
    {
        $map = [
            'area' => $withArticle ? 'el área' : 'Área',
            'team' => $withArticle ? 'el equipo' : 'Equipo',
            'group' => $withArticle ? 'el equipo' : 'Equipo',
            'member' => $withArticle ? 'el miembro' : 'Miembro',
            'meeting' => $withArticle ? 'la reunión' : 'Reunión',
            'playlist' => $withArticle ? 'el listado' : 'Listado',
            'instrument' => $withArticle ? 'el instrumento' : 'Instrumento',
            'song' => $withArticle ? 'la canción' : 'Canción',
            'invitation' => $withArticle ? 'la invitación' : 'Invitación',
            'template' => $withArticle ? 'la plantilla' : 'Plantilla'
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
