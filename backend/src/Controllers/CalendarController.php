<?php

namespace App\Controllers;

use App\Repositories\CalendarRepo;
use App\Repositories\PlaylistRepo;
use App\Helpers\Response;

class CalendarController
{
    public function handle($memberId, $action, $method)
    {
        if ($method === 'GET') {
            if ($action === 'events' || empty($action)) {
                $this->listEvents($memberId);
            } elseif ($action === 'assignment-data') {
                $this->getAssignmentData($memberId);
            } elseif (is_numeric($action)) {
                $this->showEvent($action);
            }
        } elseif ($method === 'POST') {
            if ($action === 'assignment') {
                $this->assign($memberId);
            } else {
                $this->create($memberId);
            }
        }
    }

    private function listEvents($memberId)
    {
        $churchId = $_GET['church_id'] ?? $_GET['churchId'] ?? null;
        if (!$churchId) {
            // Try to find church from member context
            $user = \App\Repositories\UserRepo::findById($memberId);
            // $churchId = $user['church_id'] ?? null; // Repo findById seems to return user_accounts
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? null;
        }

        if (!$churchId) {
            Response::error("Church ID required", 400);
        }

        $start = $_GET['start'] ?? null;
        $end = $_GET['end'] ?? null;

        $meetings = CalendarRepo::getMeetingsByChurch($churchId, $start, $end);

        // Frontend expects 'instances' array for calendar
        Response::json(['success' => true, 'instances' => $meetings]);
    }

    private function showEvent($id)
    {
        $details = CalendarRepo::getMeetingDetails($id);
        if (!$details) {
            Response::error("Event not found", 404);
        }
        Response::json(['success' => true, 'details' => $details]);
    }

    private function getAssignmentData($memberId)
    {
        $db = \App\Database::getInstance();

        // Fetch users from same church
        $member = \App\Repositories\UserRepo::getMemberData($memberId);
        $churchId = $member['church_id'] ?? null;

        $members = \App\Repositories\UserRepo::getAllWithChurch($churchId);

        // Fetch instruments
        $stmt = $db->query("SELECT id, name FROM instruments ORDER BY name ASC");
        $instruments = $stmt->fetchAll();

        // Fetch playlists
        $playlists = PlaylistRepo::getByChurch($churchId);

        Response::json([
            'success' => true,
            'members' => $members,
            'instruments' => $instruments,
            'playlists' => $playlists
        ]);
    }

    private function create($memberId)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $churchId = $data['churchId'] ?? $data['church_id'] ?? null;

        if (!$churchId) {
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? null;
        }

        $calendarId = CalendarRepo::ensureDefaultCalendar($churchId);

        $meetingId = CalendarRepo::createMeeting([
            'calendar_id' => $calendarId,
            'title' => $data['title'] ?? 'Untitled Meeting',
            'description' => $data['description'] ?? '',
            'start_at' => $data['start_at'] ?? $data['date'] ?? date('Y-m-d H:i:s'),
            'end_at' => $data['end_at'] ?? null,
            'location' => $data['location'] ?? '',
            'created_by_member_id' => $memberId
        ]);

        if ($meetingId) {
            \App\Repositories\ActivityRepo::log($churchId, $memberId, 'created', 'meeting', $meetingId, ['name' => $data['title'] ?? 'Reunión']);
        }

        Response::json(['success' => !!$meetingId, 'id' => $meetingId]);
    }

    private function assign($memberId)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $meetingId = $data['meetingId'] ?? $data['instanceId'] ?? null;
        $targetMemberId = $data['memberId'] ?? null;

        if (!$meetingId || !$targetMemberId) {
            Response::error("Meeting ID and Member ID required", 400);
        }

        $success = CalendarRepo::assignMember(
            $meetingId,
            $targetMemberId,
            $data['role'] ?? 'Member',
            $data['instrumentId'] ?? null
        );

        // Notify user
        if ($success) {
            $meeting = CalendarRepo::getMeetingDetails($meetingId);
            $targetMember = \App\Repositories\UserRepo::getMemberData($targetMemberId);

            \App\Repositories\ActivityRepo::log(
                $meeting['church_id'],
                $memberId,
                'assigned',
                'meeting',
                $meetingId,
                [
                    'target_name' => $targetMember['name'] ?? 'Miembro',
                    'meeting_title' => $meeting['title'] ?? 'Reunión'
                ]
            );

            \App\Repositories\NotificationRepo::create(
                $targetMemberId,
                'assignment',
                'Nueva asignación',
                "Has sido asignado a la reunión: " . ($meeting['title'] ?? 'Sin título'),
                "/mainhub/calendar"
            );
        }

        Response::json(['success' => $success]);
    }
}
