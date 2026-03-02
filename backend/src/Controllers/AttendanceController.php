<?php

namespace App\Controllers;

use App\Repositories\AttendanceRepo;
use App\Helpers\Response;

class AttendanceController
{
    public function handle($memberId, $action, $method)
    {
        $meetingId = $_GET['meeting_id'] ?? $_GET['meetingId'] ?? null;

        if ($method === 'GET') {
            if ($action === 'report') {
                $this->getReport($memberId);
            } elseif ($meetingId) {
                $this->getAttendance($meetingId);
            }
        } elseif ($method === 'POST') {
            if ($action === 'count') {
                $this->saveCount($memberId, $meetingId);
            } elseif ($action === 'visitor') {
                $this->addVisitor($memberId, $meetingId);
            }
        } elseif ($method === 'DELETE') {
            if ($action === 'visitor' && isset($_GET['id'])) {
                $this->deleteVisitor($memberId, $_GET['id']);
            }
        }
    }

    private function getAttendance($meetingId)
    {
        $count = AttendanceRepo::getCount($meetingId);
        $visitors = AttendanceRepo::getVisitors($meetingId);

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

        $success = AttendanceRepo::saveCount($meetingId, $adults, $children);
        Response::json(['success' => $success]);
    }

    private function addVisitor($memberId, $meetingId)
    {
        if (!$meetingId)
            Response::error("Meeting ID required", 400);

        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['first_name']))
            Response::error("First name required", 400);

        $success = AttendanceRepo::addVisitor($meetingId, $data);
        Response::json(['success' => $success]);
    }

    private function deleteVisitor($memberId, $visitorId)
    {
        $success = AttendanceRepo::deleteVisitor($visitorId);
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

        $report = AttendanceRepo::getReport($churchId, $start, $end);
        Response::json(['success' => true, 'report' => $report]);
    }
}
