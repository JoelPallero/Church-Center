<?php

namespace App\Controllers;

use App\Middleware\PermissionMiddleware;
use App\Helpers\Response;

class ActivityController
{
    public function handle($memberId, $action, $method)
    {
        if ($method === 'GET') {
            if ($action === 'stream') {
                $this->stream($memberId);
            } else {
                $this->list($memberId);
            }
        }
    }

    private function list($memberId)
    {
        $member = \App\Repositories\UserRepo::getMemberData($memberId);
        $churchId = $_GET['church_id'] ?? ($member['church_id'] ?? null);

        if (!$churchId) {
            $isSuper = \App\Repositories\PermissionRepo::isSuperAdmin($memberId);
            if ($isSuper) {
                // If superadmin, return activities from ALL churches
                $activities = \App\Repositories\ActivityRepo::getRecent(null);
                \App\Helpers\Response::json(['success' => true, 'activities' => $activities]);
                return;
            }
            // Return empty for others instead of 400
            \App\Helpers\Response::json(['success' => true, 'activities' => []]);
            return;
        }

        $activities = \App\Repositories\ActivityRepo::getRecent($churchId);
        \App\Helpers\Response::json(['success' => true, 'activities' => $activities]);
    }

    private function stream($memberId)
    {
        // SSE Stream implementation
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
        echo "data: " . json_encode(['id' => 0, 'action' => 'ping']) . "\n\n";
        exit;
    }
}
