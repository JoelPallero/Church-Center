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
        $roles = array_map(fn($r) => trim(strtolower($r['name'])), $serviceRoles);
        if ($isSuper) {
            $roles[] = 'superadmin';
        }
        $roles = array_values(array_unique($roles));

        $serviceKeys = array_values(array_unique(array_map(fn($r) => trim(strtolower($r['service_key'])), $serviceRoles)));

        // Get enabled services for this church
        $churchEnabledServices = ChurchRepo::getEnabledServiceKeys($member['church_id']);

        // Roles that should have access to core modules by default
        $churchRoles = ['pastor', 'leader', 'coordinator', 'multimedia', 'ushers', 'ujier', 'member'];
        
        if (count(array_intersect($churchRoles, $roles)) > 0) {
            // Only add default hubs if they are enabled for this church
            if (in_array('worship', $churchEnabledServices)) $serviceKeys[] = 'worship';
            // Consolidación = servicio ushers en DB (mapeo para el frontend)
            if (in_array('ushers', $churchEnabledServices)) $serviceKeys[] = 'consolidation';
            if (in_array('consolidation', $churchEnabledServices)) $serviceKeys[] = 'consolidation';
            if (in_array('social', $churchEnabledServices)) $serviceKeys[] = 'social';
        }

        // Even if explicitly assigned, if it's disabled for the church, we remove it
        $serviceKeys = array_values(array_unique(array_filter($serviceKeys, function($key) use ($churchEnabledServices) {
            if ($key === 'mainhub') return true;
            if ($key === 'consolidation') return in_array('ushers', $churchEnabledServices) || in_array('consolidation', $churchEnabledServices);
            return in_array($key, $churchEnabledServices);
        })));

        return Response::json([
            'success' => true,
            'data' => [
                'user' => $member,
                'is_superadmin' => $isSuper,
                'church' => $church,
                'permissions' => $permissions,
                'roles' => $roles,
                'services' => $serviceKeys,
                'features' => [
                    'music' => in_array('worship', $serviceKeys),
                    'social_media' => in_array('social', $serviceKeys),
                    'consolidation' => in_array('consolidation', $serviceKeys) || in_array('ushers', $serviceKeys)
                ],
                'enabled_hubs' => $churchEnabledServices // Pass this for extra checks if needed
            ]
        ]);
    }
}
