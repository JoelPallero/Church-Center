<?php

namespace App\Services;

use App\Repositories\UserRepo;
use App\Helpers\Logger;

class AccessControlService
{
    /**
     * Determine if a user can perform an action.
     * 
     * @param int $userId The ID of the member
     * @param string $permission The required permission key
     * @param array $context Additional context (e.g. organization_id)
     * @return bool
     */
    public static function can($userId, $permission, $context = [])
    {
        // 1. RBAC Check (Permissions)
        // For now, mirroring existing PermissionMiddleware logic
        // But centralized here for easier future modification (e.g. Feature Flags)

        $hasPermission = self::checkPermission($userId, $permission);

        if (!$hasPermission) {
            Logger::warning("Access Denied: User $userId lacks permission $permission");
            return false;
        }

        // 2. Subscription Check
        // Today: Always return true as per requirements.
        // Future: Check $user->organization->subscription->status

        $hasActiveSubscription = self::checkSubscription($userId, $context);

        if (!$hasActiveSubscription) {
            Logger::warning("Access Denied: User $userId has no active subscription for $permission");
            return false;
        }

        return true;
    }

    private static function checkPermission($userId, $permission)
    {
        // Integration with existing PermissionRepo
        if (\App\Repositories\PermissionRepo::isSuperAdmin($userId)) {
            return true;
        }

        return \App\Repositories\PermissionRepo::has($userId, $permission);
    }

    private static function checkSubscription($userId, $context = [])
    {
        // Closed Beta Requirement: Everyone is 'active' for now.
        return true;
    }

    /**
     * Get the subscription status for an organization or user.
     */
    public static function getSubscriptionStatus($id, $type = 'organization')
    {
        // Placeholder for future logic
        return [
            'status' => 'active',
            'trial_end' => null,
            'current_period_end' => null
        ];
    }
}
