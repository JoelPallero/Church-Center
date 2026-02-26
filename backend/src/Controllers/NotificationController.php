<?php

namespace App\Controllers;

use App\Repositories\NotificationRepo;
use App\Helpers\Response;

class NotificationController
{
    public function handle($memberId, $action, $method)
    {
        if ($method === 'GET') {
            $this->list($memberId);
        } elseif ($method === 'POST') {
            if ($action === 'read') {
                $this->markAsRead($memberId);
            }
        }
    }

    private function list($memberId)
    {
        $notifications = NotificationRepo::getByMember($memberId);
        $unreadCount = NotificationRepo::getUnreadCount($memberId);
        Response::json([
            'success' => true,
            'notifications' => $notifications,
            'unreadCount' => $unreadCount
        ]);
    }

    private function markAsRead($memberId)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $notificationId = $data['notificationId'] ?? $data['id'] ?? null;

        if ($notificationId === 'all') {
            NotificationRepo::markAllAsRead($memberId);
        } elseif ($notificationId) {
            NotificationRepo::markAsRead($notificationId, $memberId);
        }

        Response::json(['success' => true]);
    }
}
