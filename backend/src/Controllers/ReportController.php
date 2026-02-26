<?php

namespace App\Controllers;

use App\Middleware\PermissionMiddleware;
use App\Helpers\Response;

class ReportController
{
    public function handle($memberId, $action, $method)
    {
        if ($method === 'GET') {
            if ($action === 'pastor_stats') {
                $this->pastorStats($memberId);
            } else {
                $this->dashboard($memberId);
            }
        }
    }

    private function pastorStats($memberId)
    {
        $member = \App\Repositories\UserRepo::getMemberData($memberId);
        $churchId = $_GET['church_id'] ?? ($member['church_id'] ?? null);

        if (!$churchId) {
            Response::error("Church ID required", 400);
        }

        $stats = \App\Repositories\ReportRepo::getPastorStats($churchId);

        Response::json([
            'success' => true,
            'stats' => $stats
        ]);
    }

    private function dashboard($memberId)
    {
        // Global dashboard stats
        $stats = \App\Repositories\ReportRepo::getGlobalStats();
        Response::json(array_merge(['success' => true], $stats));
    }
}
