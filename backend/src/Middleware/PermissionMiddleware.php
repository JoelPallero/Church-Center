<?php

namespace App\Middleware;

use App\Repositories\PermissionRepo;
use App\Helpers\Response;

class PermissionMiddleware
{
    /**
     * Ensures the member has a specific permission.
     * Superadmins bypass everything.
     */
    public static function require($memberId, $permission)
    {
        if (PermissionRepo::isSuperAdmin($memberId)) {
            return true;
        }

        $permissions = PermissionRepo::getPermissions($memberId);
        if (!in_array($permission, $permissions)) {
            Response::error("Forbidden: Missing permission '$permission'", 403);
        }

        return true;
    }

    /**
     * Ensures the member has at least one of the provided permissions.
     */
    public static function requireAny($memberId, array $permissions)
    {
        if (PermissionRepo::isSuperAdmin($memberId)) {
            return true;
        }

        $userPermissions = PermissionRepo::getPermissions($memberId);
        foreach ($permissions as $p) {
            if (in_array($p, $userPermissions)) {
                return true;
            }
        }

        Response::error("Forbidden: Missing required permissions", 403);
    }
}
