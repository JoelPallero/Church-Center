<?php

namespace App\Controllers;

use App\Middleware\PermissionMiddleware;
use App\Helpers\Response;

class ReportController
{
    public function handle($memberId, $action, $method)
    {
        $churchId = $_GET['church_id'] ?? $_GET['churchId'] ?? null;

        \App\Middleware\PermissionMiddleware::require($memberId, 'church.read', $churchId);

        if ($method === 'GET') {
            if ($action === 'pastor_stats') {
                $this->pastorStats($memberId, $churchId);
            } else {
                $this->dashboard($memberId, $churchId);
            }
        }
    }

    private function pastorStats($memberId, $churchId = null)
    {
        if (!$churchId) {
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? null;
        }

        if (!$churchId) {
            Response::error("Church ID required", 400);
        }

        $stats = \App\Repositories\ReportRepo::getPastorStats($churchId);

        Response::json([
            'success' => true,
            'stats' => $stats
        ]);
    }

    private function dashboard($memberId, $churchId = null)
    {
        if (!$churchId) {
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? null;
        }

        if ($churchId) {
            $stats = \App\Repositories\ReportRepo::getChurchStats($churchId);
            $dbStatus = $stats['db_status'] ?? ['main' => 'online', 'music' => 'error'];
            unset($stats['db_status']);

            Response::json([
                'success' => true,
                'db_status' => $dbStatus,
                'data' => $stats
            ]);
        }

        // Only allow global stats access if superadmin
        if (\App\Repositories\PermissionRepo::isSuperAdmin($memberId)) {
            $stats = \App\Repositories\ReportRepo::getGlobalStats();
            $dbStatus = $stats['db_status'] ?? ['main' => 'online', 'music' => 'error'];
            unset($stats['db_status']);

            Response::json([
                'success' => true,
                'db_status' => $dbStatus,
                'data' => $stats
            ]);
        }

        Response::error("Church context required for dashboard", 403);
    }
}
