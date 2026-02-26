<?php

namespace App\Controllers;

use App\Middleware\PermissionMiddleware;
use App\Helpers\Response;

class InstrumentController
{
    public function handle($memberId, $action, $method)
    {
        if ($method === 'GET') {
            // Everyone can read instruments usually
            $this->list();
        } elseif ($method === 'POST' && $action === 'mine') {
            $this->updateMine($memberId);
        }
    }

    private function list()
    {
        $db = \App\Database::getInstance();
        $stmt = $db->query("SELECT * FROM instruments ORDER BY category, name");
        $instruments = $stmt->fetchAll();
        Response::json(['success' => true, 'instruments' => $instruments]);
    }

    private function updateMine($memberId)
    {
        Response::json(['success' => true, 'message' => 'Your instruments updated']);
    }
}
