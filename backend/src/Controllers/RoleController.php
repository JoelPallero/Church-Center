<?php

namespace App\Controllers;

use App\Helpers\Response;

class RoleController
{
    public function handle($memberId, $action, $method)
    {
        // Require church.read OR being superadmin (handled by middleware)
        \App\Middleware\PermissionMiddleware::require($memberId, 'church.read');

        if ($method === "GET") {
            $this->list();
        } else {
            Response::error("Method not allowed", 405);
        }
    }

    private function list()
    {
        try {
            $db = \App\Database::getInstance();
            // Fetch all roles, prioritizing MainHub or global ones.
            // Joining with services to get the service key if needed for the UI.
            $stmt = $db->prepare("
                SELECT r.id, r.name, r.display_name as displayName, s.key as serviceKey
                FROM roles r
                LEFT JOIN services s ON r.service_id = s.id
                ORDER BY r.level ASC, r.display_name ASC
            ");
            $stmt->execute();
            $roles = $stmt->fetchAll();

            Response::json([
                "success" => true,
                "roles" => $roles
            ]);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("RoleController Error: " . $e->getMessage());
            Response::error("Internal Server Error", 500);
        }
    }
}
