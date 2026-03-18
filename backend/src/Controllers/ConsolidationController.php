<?php

namespace App\Controllers;

use App\Repositories\ConsolidationRepo;
use App\Helpers\Response;

class ConsolidationController
{
    public function handle($memberId, $action, $method)
    {
        $meetingId = $_GET['meeting_id'] ?? $_GET['meetingId'] ?? null;
        $churchId = $_GET['church_id'] ?? $_GET['churchId'] ?? null;

        if ($method === 'GET') {
            // Ujier y Pastor: reunions.view permite ver reportes, visitantes y asistencia
            \App\Middleware\PermissionMiddleware::requireAny($memberId, ['reunions.view', 'church.read'], $churchId);
            if ($action === 'report') {
                $this->getReport($memberId);
            } elseif ($action === 'database') {
                $this->getVisitorsDatabase($memberId);
            } elseif ($action === 'followups') {
                $this->getFollowUps($_GET['visitor_id'] ?? null);
            } elseif ($meetingId) {
                $this->getAttendance($meetingId);
            }
        } elseif ($method === 'POST') {
            \App\Middleware\PermissionMiddleware::require($memberId, 'reunions.view', $churchId);
            if ($action === 'count') {
                $this->saveCount($memberId, $meetingId);
            } elseif ($action === 'visitor') {
                $this->addVisitor($memberId, $meetingId);
            } elseif ($action === 'followup') {
                $this->addFollowUp($memberId);
            }
        } elseif ($method === 'DELETE') {
            \App\Middleware\PermissionMiddleware::require($memberId, 'reunions.view', $churchId);
            if ($action === 'visitor' && isset($_GET['id'])) {
                $this->deleteVisitor($memberId, $_GET['id']);
            }
        }
    }

    private function getAttendance($meetingId)
    {
        $count = ConsolidationRepo::getCount($meetingId);
        $visitors = ConsolidationRepo::getVisitors($meetingId);

        Response::json([
            'success' => true,
            'count' => $count,
            'visitors' => $visitors
        ]);
    }

    private function saveCount($memberId, $meetingId)
    {
        if (!$meetingId)
            Response::error("Meeting ID required", 400);

        $data = json_decode(file_get_contents('php://input'), true);
        $adults = (int) ($data['adults'] ?? 0);
        $children = (int) ($data['children'] ?? 0);
        $newPeople = (int) ($data['newPeople'] ?? $data['new_people'] ?? 0);

        // Validation: Cannot register for future meetings
        $db = \App\Database::getInstance();
        $stmt = $db->prepare("SELECT start_at FROM meetings WHERE id = ?");
        $stmt->execute([$meetingId]);
        $meeting = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($meeting) {
            $meetingStart = strtotime($meeting['start_at']);
            $now = time();
            if ($meetingStart > $now) {
                Response::error("No se puede registrar asistencia para reuniones futuras", 403);
            }
        }

        $success = ConsolidationRepo::saveCount($meetingId, $adults, $children, $newPeople);
        Response::json(['success' => $success]);
    }

    private function addVisitor($memberId, $meetingId)
    {
        if (!$meetingId)
            Response::error("Meeting ID required", 400);

        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['first_name']))
            Response::error("First name required", 400);

        $success = ConsolidationRepo::addVisitor($meetingId, $data);
        Response::json(['success' => $success]);
    }

    private function deleteVisitor($memberId, $visitorId)
    {
        $success = ConsolidationRepo::deleteVisitor($visitorId);
        Response::json(['success' => $success]);
    }

    private function getReport($memberId)
    {
        $churchId = $_GET['church_id'] ?? $_GET['churchId'] ?? null;
        $start = $_GET['start'] ?? date('Y-m-01');
        $end = $_GET['end'] ?? date('Y-m-t');

        if (!$churchId) {
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? null;
        }

        $report = ConsolidationRepo::getReport($churchId, $start, $end);
        Response::json(['success' => true, 'report' => $report]);
    }

    private function getVisitorsDatabase($memberId)
    {
        $churchId = $_GET['church_id'] ?? $_GET['churchId'] ?? null;
        if (!$churchId) {
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? null;
        }

        $visitors = ConsolidationRepo::getVisitorsDatabase($churchId);
        Response::json(['success' => true, 'visitors' => $visitors]);
    }

    private function addFollowUp($memberId)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $visitorId = $data['visitor_id'] ?? null;

        if (!$visitorId)
            Response::error("Visitor ID required", 400);

        $success = ConsolidationRepo::addFollowUp($visitorId, $data, $memberId);
        Response::json(['success' => $success]);
    }

    private function getFollowUps($visitorId)
    {
        if (!$visitorId)
            Response::error("Visitor ID required", 400);

        $logs = ConsolidationRepo::getFollowUps($visitorId);
        Response::json(['success' => true, 'logs' => $logs]);
    }
}
