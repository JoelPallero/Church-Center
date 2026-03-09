<?php

namespace App\Controllers;

use App\Repositories\UserRepo;
use App\Repositories\PermissionRepo;
use App\Repositories\ChurchRepo;
use App\Helpers\Response;

class BootstrapController
{
    public function index($memberId)
    {
        $member = UserRepo::getMemberData($memberId);
        if (!$member) {
            return Response::error("Member not found", 404);
        }

        $church = ChurchRepo::findById($member['church_id']);
        $permissions = PermissionRepo::getPermissions($memberId, $member['church_id']);
        $serviceRoles = PermissionRepo::getServiceRoles($memberId, $member['church_id']);

        $isSuper = PermissionRepo::isSuperAdmin($memberId);
        $roles = array_map(fn($r) => $r['name'], $serviceRoles);
        if ($isSuper) {
            $roles[] = 'superadmin';
        }
        $roles = array_values(array_unique($roles));

        $serviceKeys = array_values(array_unique(array_map(fn($r) => $r['service_key'], $serviceRoles)));

        // Pastors should have access to all services by default
        if (in_array('pastor', $roles)) {
            $serviceKeys[] = 'worship';
            $serviceKeys[] = 'social';
            // Add other modules as they are created
        }
        $serviceKeys = array_values(array_unique($serviceKeys));

        return Response::json([
            'success' => true,
            'data' => [
                'user' => $member,
                'is_superadmin' => $isSuper,
                'church' => $church,
                'permissions' => $permissions,
                'roles' => $roles,
                'services' => array_unique($serviceKeys),
                'features' => [
                    'music' => in_array('worship', $serviceKeys),
                    'social_media' => in_array('social', $serviceKeys)
                ]
            ]
        ]);
    }
}
