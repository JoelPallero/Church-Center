<?php

namespace App\Controllers;

use App\Repositories\ChurchRepo;
use App\Middleware\PermissionMiddleware;
use App\Helpers\Response;

class ChurchController
{
    public function handle($memberId, $action, $method)
    {
        $uri = $_SERVER['REQUEST_URI'];
        $isServicesRequest = strpos($uri, '/services') !== false;

        if ($method === 'GET') {
            PermissionMiddleware::require($memberId, 'church.read');
            if ($action === 'my_churches') {
                $this->myChurches($memberId);
            } elseif ($isServicesRequest && is_numeric($action)) {
                $this->getServices($action);
            } elseif ($action && is_numeric($action)) {
                $this->show($action);
            } else {
                $this->list();
            }
        } elseif ($method === 'POST') {
            PermissionMiddleware::require($memberId, 'church.update');
            if ($action === 'restore') {
                $this->restore();
            } else {
                $this->create($memberId);
            }
        } elseif ($method === 'PUT') {
            PermissionMiddleware::require($memberId, 'church.update');
            if ($isServicesRequest && is_numeric($action)) {
                $this->updateServices($action);
            } else {
                $this->update($memberId, $action);
            }
        } elseif ($method === 'DELETE') {
            PermissionMiddleware::require($memberId, 'church.update');
            $this->delete($memberId, $action);
        }
    }

    private function list()
    {
        $churches = ChurchRepo::getAll();
        Response::json(['success' => true, 'churches' => $churches]);
    }

    private function myChurches($memberId)
    {
        // If master, show all churches
        $isSuper = \App\Repositories\PermissionRepo::isSuperAdmin($memberId);
        if ($isSuper) {
            $churches = ChurchRepo::getAll();
        } else {
            $churches = ChurchRepo::getByMember($memberId);
        }
        Response::json(['success' => true, 'churches' => $churches ?: []]);
    }

    private function create($memberId)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['name']) || !isset($data['slug'])) {
            Response::json(['success' => false, 'error' => 'Datos incompletos'], 400);
            return;
        }

        try {
            $churchId = ChurchRepo::create(
                $data['name'], 
                $data['slug'], 
                $data['address'] ?? null, 
                $data['timezone'] ?? 'America/Argentina/Buenos_Aires'
            );
            if ($churchId) {
                Response::json([
                    'success' => true,
                    'id' => $churchId,
                    'message' => 'Iglesia creada correctamente'
                ]);
            } else {
                Response::json(['success' => false, 'error' => 'No se pudo crear la iglesia'], 500);
            }
        } catch (\Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    private function show($id)
    {
        $church = ChurchRepo::findById($id);
        if ($church) {
            Response::json(['success' => true, 'church' => $church]);
        } else {
            Response::error("Iglesia no encontrada", 404);
        }
    }

    private function update($memberId, $id)
    {
        if (!$id || !is_numeric($id)) {
            Response::error("ID de iglesia inválido", 400);
        }

        // Only master can update
        $isSuper = \App\Repositories\PermissionRepo::isSuperAdmin($memberId);
        if (!$isSuper) {
            Response::error("No tienes permisos para editar iglesias", 403);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['name']) || !isset($data['slug'])) {
            Response::error("Datos incompletos", 400);
        }

        $success = ChurchRepo::update(
            $id, 
            $data['name'], 
            $data['slug'], 
            $data['address'] ?? null, 
            $data['timezone'] ?? null
        );
        Response::json(['success' => $success, 'message' => $success ? 'Iglesia actualizada' : 'Error al actualizar']);
    }

    private function delete($memberId, $id)
    {
        if (!$id || !is_numeric($id)) {
            Response::error("ID de iglesia inválido", 400);
        }

        // Only master can delete
        $isSuper = \App\Repositories\PermissionRepo::isSuperAdmin($memberId);
        if (!$isSuper) {
            Response::error("No tienes permisos para borrar iglesias", 403);
        }

        $church = ChurchRepo::findById($id);
        if (!$church) {
            Response::error("Iglesia no encontrada", 404);
        }

        if ($church['is_active']) {
            // Stage 1: Deactivate
            $success = ChurchRepo::deactivate($id);
            Response::json(['success' => $success, 'message' => $success ? 'Iglesia desactivada correctamente' : 'Error al desactivar']);
        } else {
            // Stage 2: Hard Delete
            $success = ChurchRepo::hardDelete($id);
            Response::json(['success' => $success, 'message' => $success ? 'Iglesia y todos sus datos han sido eliminados permanentemente' : 'Error al eliminar']);
        }
    }

    private function restore()
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? null;

        if (!$id || !is_numeric($id)) {
            Response::error("ID de iglesia inválido", 400);
        }

        $success = ChurchRepo::restore($id);
        Response::json(['success' => $success, 'message' => $success ? 'Iglesia restaurada correctamente' : 'Error al restaurar']);
    }

    private function getServices($churchId)
    {
        $services = ChurchRepo::getServices($churchId);
        Response::json(['success' => true, 'services' => $services]);
    }

    private function updateServices($churchId)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['services'])) {
            Response::error("Datos incompletos", 400);
        }

        foreach ($data['services'] as $svc) {
            ChurchRepo::updateService($churchId, $svc['id'], $svc['is_enabled']);
        }

        Response::json(['success' => true, 'message' => 'Configuración de hubs actualizada']);
    }
}
