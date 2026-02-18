<?php
require_once __DIR__ . '/../config/Database.php';

class ActivityManager
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Log a new activity into the audit_log table.
     */
    public function log($churchId, $userId, $action, $entityType = null, $entityId = null, $oldValues = null, $newValues = null)
    {
        try {
            $sql = "INSERT INTO audit_log (church_id, user_id, action, entity_type, entity_id, new_values) 
                    VALUES (:cid, :uid, :action, :etype, :eid, :new)";

            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                ':cid' => $churchId,
                ':uid' => $userId,
                ':action' => $action,
                ':etype' => $entityType,
                ':eid' => $entityId,
                ':new' => $newValues ? json_encode($newValues) : null
            ]);
        } catch (Exception $e) {
            error_log("Failed to log activity: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Fetch activities based on user role and church.
     */
    public function getActivities($churchId, $isMaster = false, $limit = 20)
    {
        $sql = "SELECT al.*, m.name as user_name 
                FROM audit_log al
                LEFT JOIN member m ON al.user_id = m.id
                WHERE (:is_master = 1 OR al.church_id = :cid)
                ORDER BY al.created_at DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':is_master', $isMaster ? 1 : 0, PDO::PARAM_INT);
        $stmt->bindValue(':cid', $churchId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Fetch activities created after a specific ID.
     */
    public function getActivitiesAfterId($churchId, $afterId, $isMaster = false)
    {
        $sql = "SELECT al.*, m.name as user_name 
                FROM audit_log al
                LEFT JOIN member m ON al.user_id = m.id
                WHERE (:is_master = 1 OR al.church_id = :cid)
                AND al.id > :after_id
                ORDER BY al.id ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':is_master', $isMaster ? 1 : 0, PDO::PARAM_INT);
        $stmt->bindValue(':cid', $churchId, PDO::PARAM_INT);
        $stmt->bindValue(':after_id', (int) $afterId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
