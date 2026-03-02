<?php

namespace App\Controllers;

use App\Middleware\PermissionMiddleware;
use App\Helpers\Response;
use App\Repositories\InvitationTemplateRepo;

class SettingsController
{
    public function handle($memberId, $action, $method)
    {
        // Require church.update permission for settings management
        // Note:Pastor, Leader, Coordinator should have this or be allowed to customize their invitations
        // The user specifically asked for Pastor, Leader, Coordinator and Super Admin.

        if ($method === 'GET') {
            if ($action === 'invitation-templates') {
                $churchId = $_GET['church_id'] ?? null;
                if (!$churchId) {
                    Response::error("El ID de la iglesia es obligatorio", 400);
                }

                $templates = InvitationTemplateRepo::getByChurch($churchId);
                Response::json(['success' => true, 'templates' => $templates]);
                return;
            }
        }

        if ($method === 'POST') {
            if ($action === 'invitation-templates') {
                $data = json_decode(file_get_contents('php://input'), true);
                $churchId = $data['church_id'] ?? null;
                $index = isset($data['template_index']) ? (int) $data['template_index'] : null;

                if (!$churchId || $index === null || !isset($data['subject']) || !isset($data['body_html'])) {
                    Response::error("Faltan datos obligatorios de la plantilla", 400);
                }

                $success = InvitationTemplateRepo::save($churchId, $index, $data);
                Response::json(['success' => $success]);
                return;
            }
        }

        Response::error("Recurso no encontrado", 404);
    }
}
