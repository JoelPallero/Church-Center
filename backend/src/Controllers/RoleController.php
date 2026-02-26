<?php

namespace App\Controllers;

use App\Helpers\Response;

class RoleController
{
    public function handle($memberId, $action, $method)
    {
        if ($method === 'GET') {
            $this->list();
        }
    }

    private function list()
    {
        $db = \App\Database::getInstance();
        $stmt = $db->query("SELECT id, name, display_name FROM roles ORDER BY display_name ASC");
        $roles = $stmt->fetchAll();
        Response::json(['success' => true, 'roles' => $roles]);
    }
}
