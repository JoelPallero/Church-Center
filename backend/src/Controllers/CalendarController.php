<?php

namespace App\Controllers;

use App\Repositories\CalendarRepo;
use App\Repositories\PlaylistRepo;
use App\Helpers\Response;

class CalendarController
{
    public function handle($memberId, $action, $method)
    {
        $churchId = $_GET['church_id'] ?? $_GET['churchId'] ?? null;
        $data = [];
        if ($method === 'POST' || $method === 'PUT') {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true) ?? [];
            if (!$churchId) {
                $churchId = $data['churchId'] ?? $data['church_id'] ?? null;
            }
        }

        $isSuperAdmin = \App\Repositories\PermissionRepo::isSuperAdmin($memberId);
        if (!$isSuperAdmin && ($churchId === null || (int) $churchId === 0)) {
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? null;
        }

        if ($method === 'GET') {
            \App\Middleware\PermissionMiddleware::require($memberId, 'calendar.read', $churchId);
            if ($action === 'events' || empty($action)) {
                $this->listEvents($memberId, $churchId);
            } elseif ($action === 'categories') {
                $this->listCategories($churchId);
            } elseif ($action === 'assignment-data') {
                $this->getAssignmentData($memberId);
            } elseif (is_numeric($action)) {
                $this->showEvent($action);
            }
        } elseif ($method === 'POST') {
            if ($action === 'assignment') {
                \App\Middleware\PermissionMiddleware::require($memberId, 'meeting.update', $churchId);
                $this->assign($memberId, $data);
            } elseif ($action === 'categories') {
                \App\Middleware\PermissionMiddleware::require($memberId, 'meeting.create', $churchId);
                $this->saveCategory($churchId, $data);
            } elseif ($action === 'assign_setlist') {
                \App\Middleware\PermissionMiddleware::require($memberId, 'meeting.update', $churchId);
                $this->assignSetlist($memberId, $data);
            } else {
                \App\Middleware\PermissionMiddleware::require($memberId, 'meeting.create', $churchId);
                $this->create($memberId, $churchId, $data);
            }
        } elseif ($method === 'PUT') {
            \App\Middleware\PermissionMiddleware::require($memberId, 'meeting.update', $churchId);
            $this->update($action, $data);
        } elseif ($method === 'DELETE') {
            \App\Middleware\PermissionMiddleware::require($memberId, 'meeting.delete', $churchId);
            $this->delete($memberId, $action);
        }
    }

    private function delete($memberId, $id)
    {
        if (!is_numeric($id)) {
            Response::error("Invalid meeting ID", 400);
        }

        $success = CalendarRepo::deleteMeeting($id);
        Response::json(['success' => $success]);
    }

    private function listEvents($memberId, $churchId = null)
    {
        if (!$churchId) {
            $member = \App\Repositories\UserRepo::getMemberData($memberId);
            $churchId = $member['church_id'] ?? null;
        }

        $isSuperAdmin = \App\Repositories\PermissionRepo::isSuperAdmin($memberId);

        if (!$churchId && !$isSuperAdmin) {
            Response::json(['success' => true, 'instances' => [], 'message' => 'No church selected']);
            return;
        }

        $start = $_GET['start'] ?? null;
        $end = $_GET['end'] ?? null;
        $month = $_GET['month'] ?? null;
        $year = $_GET['year'] ?? date('Y');

        if (!$start && $month) {
            $start = "$year-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-01 00:00:00";
            $end = date("Y-m-t 23:59:59", strtotime($start));
        }

        $meetings = CalendarRepo::getMeetingsByChurch($churchId, $start, $end);

        Response::json([
            'success' => true,
            'instances' => $meetings,
            'debug' => [
                'churchId' => $churchId,
                'isSuperAdmin' => $isSuperAdmin,
                'memberId' => $memberId,
                'count' => count($meetings),
                'filters' => ['start' => $start, 'end' => $end]
            ]
        ]);
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

    private function create($memberId, $churchId = null, $data = [])
    {
        try {
            if (!$churchId) {
                $churchId = $data['churchId'] ?? $data['church_id'] ?? null;
            }

            if (!$churchId) {
                $member = \App\Repositories\UserRepo::getMemberData($memberId);
                $churchId = $member['church_id'] ?? null;
            }

            if (!$churchId) {
                Response::error("Church ID required for meeting creation", 400);
            }

            $calendarId = CalendarRepo::ensureDefaultCalendar($churchId);

            $meetingId = CalendarRepo::createMeeting([
                'calendar_id' => $calendarId,
                'title' => $data['title'] ?? 'Untitled Meeting',
                'description' => $data['description'] ?? '',
                'start_at' => $data['start_at'] ?? null,
                'end_at' => $data['end_at'] ?? null,
                'meeting_type' => $data['meeting_type'] ?? 'special',
                'day_of_week' => $data['recurrence']['day_of_week'] ?? null,
                'start_time' => $data['recurrence']['start_time'] ?? null,
                'end_time' => $data['recurrence']['end_time'] ?? null,
                'location' => $data['location'] ?? '',
                'category' => $data['category'] ?? null,
                'created_by_member_id' => $memberId
            ]);

            if ($meetingId) {
                \App\Repositories\ActivityRepo::log($churchId, $memberId, 'created', 'meeting', $meetingId, ['name' => $data['title'] ?? 'Reunión']);
            }

            Response::json(['success' => !!$meetingId, 'id' => $meetingId]);
        } catch (\PDOException $e) {
            \App\Helpers\Logger::error("Meeting creation DB error: " . $e->getMessage());
            Response::error("Error de base de datos: " . $e->getMessage(), 500);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("Meeting creation general error: " . $e->getMessage());
            Response::error($e->getMessage(), 500);
        }
    }


    private function assign($memberId, $data = [])
    {
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

    private function listCategories($churchId)
    {
        $categories = CalendarRepo::getCategories($churchId);
        Response::json(['success' => true, 'categories' => $categories]);
    }

    private function saveCategory($churchId, $data)
    {
        if (empty($data['name'])) {
            Response::error("Category name required", 400);
        }
        $id = CalendarRepo::createCategory(
            $churchId,
            $data['name'],
            $data['color'] ?? '#3d68df',
            $data['icon'] ?? 'event'
        );
        Response::json(['success' => true, 'id' => $id]);
    }

    private function update($meetingId, $data)
    {
        try {
            if (!is_numeric($meetingId)) {
                Response::error("Invalid meeting ID", 400);
            }

            // Unpack recurrence if present, just like in create()
            $updateData = [
                'title' => $data['title'] ?? 'Untitled',
                'description' => $data['description'] ?? '',
                'start_at' => $data['start_at'] ?? null,
                'end_at' => $data['end_at'] ?? null,
                'location' => $data['location'] ?? '',
                'category' => $data['category'] ?? null,
                'meeting_type' => $data['meeting_type'] ?? 'special',
                'day_of_week' => $data['recurrence']['day_of_week'] ?? null,
                'start_time' => $data['recurrence']['start_time'] ?? null,
                'end_time' => $data['recurrence']['end_time'] ?? null
            ];

            $success = CalendarRepo::updateMeeting($meetingId, $updateData);
            Response::json(['success' => $success]);
        } catch (\PDOException $e) {
            \App\Helpers\Logger::error("Meeting update DB error: " . $e->getMessage());
            Response::error("Error de actualización de base de datos: " . $e->getMessage(), 500);
        } catch (\Exception $e) {
            \App\Helpers\Logger::error("Meeting update general error: " . $e->getMessage());
            Response::error($e->getMessage(), 500);
        }
    }

    private function assignSetlist($memberId, $data)
    {
        $meetingId = $data['meetingId'] ?? $data['meeting_instance_id'] ?? null;
        $playlistId = $data['playlistId'] ?? $data['setlist_id'] ?? null;

        if (!$meetingId || !$playlistId) {
            Response::error("Meeting ID and Playlist ID required", 400);
        }

        $success = PlaylistRepo::assignToMeeting($meetingId, $playlistId, $memberId);
        Response::json(['success' => $success]);
    }
}
