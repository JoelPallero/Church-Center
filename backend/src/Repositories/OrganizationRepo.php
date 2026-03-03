<?php

namespace App\Repositories;

use App\Database;
use App\Helpers\Logger;
use PDO;

class OrganizationRepo
{
    public static function findById($id)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM organizations WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public static function findBySlug($slug)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM organizations WHERE slug = ?");
        $stmt->execute([$slug]);
        return $stmt->fetch();
    }

    public static function create($name, $slug)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("INSERT INTO organizations (name, slug) VALUES (?, ?)");
        $success = $stmt->execute([$name, $slug]);

        if ($success) {
            $id = $db->lastInsertId();
            Logger::info("Organization created: ID $id ($name)");
            return $id;
        }

        return false;
    }

    public static function assignUser($memberId, $organizationId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("UPDATE member SET organization_id = ? WHERE id = ?");
        return $stmt->execute([$organizationId, $memberId]);
    }

    public static function updateSubscription($orgId, $subscriptionId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("UPDATE organizations SET current_subscription_id = ? WHERE id = ?");
        return $stmt->execute([$subscriptionId, $orgId]);
    }
}
