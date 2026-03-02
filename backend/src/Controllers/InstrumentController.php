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
        }
        elseif ($method === 'POST' && $action === 'mine') {
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
        $data = json_decode(file_get_contents('php://input'), true);
        $instrumentIds = $data['instruments'] ?? [];

        $success = \App\Repositories\UserRepo::setUserInstruments($memberId, $instrumentIds);

        Response::json([
            'success' => $success,
            'message' => $success ? 'Instrumentos actualizados' : 'Error al actualizar instrumentos'
        ]);
    }
}
