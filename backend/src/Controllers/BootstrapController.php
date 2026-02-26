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
        $permissions = PermissionRepo::getPermissions($memberId);
        $serviceRoles = PermissionRepo::getServiceRoles($memberId);

        $isSuper = PermissionRepo::isSuperAdmin($memberId);
        $roles = array_map(fn($r) => $r['name'], $serviceRoles);
        if ($isSuper) {
            $roles[] = 'superadmin';
        }
        $roles = array_values(array_unique($roles));

        $serviceKeys = array_values(array_unique(array_map(fn($r) => $r['service_key'], $serviceRoles)));

        return Response::json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $member['id'],
                    'name' => $member['name'],
                    'email' => $member['email']
                ],
                'is_superadmin' => $isSuper,
                'church' => $church,
                'permissions' => $permissions,
                'roles' => $roles,
                'services' => array_unique($serviceKeys),
                'features' => [
                    'music' => in_array('ministry_hub', $serviceKeys),
                    'social_media' => in_array('sm_hub', $serviceKeys)
                ]
            ]
        ]);
    }
}
