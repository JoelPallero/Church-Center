<?php

namespace App\Repositories;

use App\Database;
use App\Helpers\Logger;
use PDO;

class SubscriptionRepo
{
    public static function findByOrganization($organizationId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM subscriptions WHERE organization_id = ? ORDER BY created_at DESC LIMIT 1");
        $stmt->execute([$organizationId]);
        return $stmt->fetch();
    }

    public static function findByMember($memberId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM subscriptions WHERE member_id = ? ORDER BY created_at DESC LIMIT 1");
        $stmt->execute([$memberId]);
        return $stmt->fetch();
    }

    public static function create($data)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            INSERT INTO subscriptions (organization_id, member_id, status, trial_end, current_period_end)
            VALUES (?, ?, ?, ?, ?)
        ");

        $success = $stmt->execute([
            $data['organization_id'] ?? null,
            $data['member_id'] ?? null,
            $data['status'] ?? 'active',
            $data['trial_end'] ?? null,
            $data['current_period_end'] ?? null
        ]);

        if ($success) {
            $id = $db->lastInsertId();
            Logger::info("Subscription created: ID $id for " . ($data['organization_id'] ? "Org " . $data['organization_id'] : "Member " . $data['member_id']));
            return $id;
        }

        return false;
    }

    public static function updateStatus($id, $status)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("UPDATE subscriptions SET status = ?, updated_at = NOW() WHERE id = ?");
        return $stmt->execute([$status, $id]);
    }
}
