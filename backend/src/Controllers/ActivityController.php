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
        header('X-Accel-Buffering: no'); // Disable proxy buffering for Nginx
        ob_end_clean(); // Disable output buffering

        $lastId = (int) ($_GET['lastId'] ?? 0);
        $churchId = $_GET['church_id'] ?? null;

        // Loop to keep connection alive
        $startTime = time();
        $maxDuration = 25; // Close after 25s to avoid script timeout on common hostings

        while (time() - $startTime < $maxDuration) {
            $activities = \App\Repositories\ActivityRepo::getNewerThan($lastId, $churchId);

            if (!empty($activities)) {
                foreach ($activities as $activity) {
                    echo "data: " . json_encode($activity) . "\n\n";
                    $lastId = $activity['id'];
                }
                ob_flush();
                flush();
            } else {
                // Send ping to keep connection alive
                echo ": ping\n\n";
                ob_flush();
                flush();
            }

            // Check if connection is still active
            if (connection_aborted())
                break;

            sleep(2); // Wait 2s before polling again
        }
        exit;
    }
}
