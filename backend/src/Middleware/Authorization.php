<?php
/**
 * Contextual Authorization Middleware for MSM2
 * Validates: Authentication, Hub Access (users_services), Church compatibility, and Permissions.
 */

class Authorization
{
    private $auth;
    private $user;

    public function __construct($auth, $user)
    {
        $this->auth = $auth;
        $this->user = $user;
    }

    /**
     * Validate access to a specific hub and optional permission.
     * 
     * @param string $serviceKey The hub key (worship, social, mainhub)
     * @param string|null $permission Optional permission name to check
     * @return array ['success' => bool, 'error' => string, 'code' => int]
     */
    public function authorize($serviceKey, $permission = null)
    {
        // 1. Authenticated?
        if (!$this->user) {
            return ['success' => false, 'error' => 'No se detectó una sesión válida.', 'code' => 401];
        }

        $memberId = $this->user['mid'];
        $churchId = $this->user['cid'];

        // 2, 3, 4, 6. Service enabled, Church match, etc.
        if (!$this->auth->checkAccess($memberId, $churchId, $serviceKey)) {
            return [
                'success' => false,
                'error' => "Usted no tiene acceso habilitado para el módulo [$serviceKey] en esta iglesia.",
                'code' => 403
            ];
        }

        // 5. Role Permission check
        if ($permission) {
            $permissions = $this->auth->getUserPermissions($memberId, $serviceKey);
            if (!in_array($permission, $permissions)) {
                return [
                    'success' => false,
                    'error' => "No tiene el permiso necesario [$permission] para esta acción.",
                    'code' => 403
                ];
            }
        }

        return ['success' => true];
    }

    /**
     * Utility to stop execution and return JSON error if not authorized.
     */
    public function protect($serviceKey, $permission = null)
    {
        $result = $this->authorize($serviceKey, $permission);
        if (!$result['success']) {
            http_response_code($result['code']);
            header('Content-Type: application/json');
            echo json_encode($result);
            exit;
        }
        return true;
    }
}
