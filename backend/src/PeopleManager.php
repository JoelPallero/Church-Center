<?php
/**
 * PeopleManager.php - Gestión de Miembros y Roles
 */

require_once __DIR__ . '/../config/Database.php';

class PeopleManager
{
    private $db;
    private $activity;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
        require_once __DIR__ . '/ActivityManager.php';
        $this->activity = new ActivityManager();
    }

    /**
     * Listar todos los miembros (con sus roles)
     */
    public function getAll()
    {
        if (!$this->db) {
            Debug::error("No DB connection in PeopleManager::getAll");
            return [];
        }

        $sql = "
            SELECT 
                m.id, 
                m.name, 
                m.email, 
                m.phone,
                m.sex,
                m.church_id,
                r.name as role_name,
                r.display_name as role_display,
                s.name as status,
                a.id as area_id,
                a.name as area_name,
                (ua.id IS NOT NULL) as has_account
            FROM `member` m
            LEFT JOIN `roles` r ON m.role_id = r.id
            LEFT JOIN `status` s ON m.status_id = s.id
            LEFT JOIN `member_area` ma ON m.id = ma.member_id
            LEFT JOIN `area` a ON ma.area_id = a.id
            LEFT JOIN `user_accounts` ua ON m.id = ua.member_id
            WHERE r.name != 'master'
            ORDER BY m.name ASC
        ";
        $stmt = $this->db->query($sql);
        if (!$stmt) {
            $error = $this->db->errorInfo();
            Debug::error("SQL Error in PeopleManager::getAll: " . ($error[2] ?? 'Unknown error'));
            return [];
        }
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Debug::log("PeopleManager::getAll | Raw results count: " . count($results));

        // Group areas by member
        $users = [];
        foreach ($results as $row) {
            $mid = $row['id'];
            if (!isset($users[$mid])) {
                $users[$mid] = $row;
                $users[$mid]['areas'] = [];
            }
            if (isset($row['area_id']) && $row['area_id']) {
                $users[$mid]['areas'][] = [
                    'id' => $row['area_id'],
                    'name' => $row['area_name']
                ];
            }
            // Remove flat area fields to avoid confusion
            unset($users[$mid]['area_id']);
            unset($users[$mid]['area_name']);
        }

        Debug::log("PeopleManager::getAll | Grouped users count: " . count($users));
        return array_values($users);
    }

    /**
     * Actualizar el rol de un miembro
     */
    public function updateRole($userId, $roleId)
    {
        $sql = "UPDATE member SET role_id = :rid WHERE id = :uid";
        $stmt = $this->db->prepare($sql);
        $success = $stmt->execute([':rid' => $roleId, ':uid' => $userId]);
        if ($success) {
            Debug::log("PEOPLE_ROLE_UPDATE_SUCCESS | UserID: $userId | RoleID: $roleId");
            $this->activity->log(null, null, 'user.role_update', 'member', $userId, null, ['role_id' => $roleId]);
        } else {
            Debug::error("PEOPLE_ROLE_UPDATE_FAILED | UserID: $userId | RoleID: $roleId");
        }
        return $success;
    }

    /**
     * Actualizar el estado de un miembro
     */
    public function updateStatus($userId, $statusId)
    {
        $sql = "UPDATE member SET status_id = :sid WHERE id = :uid";
        $stmt = $this->db->prepare($sql);
        $success = $stmt->execute([':sid' => $statusId, ':uid' => $userId]);
        if ($success) {
            Debug::log("PEOPLE_STATUS_UPDATE_SUCCESS | UserID: $userId | StatusID: $statusId");
            $this->activity->log(null, null, 'user.status_update', 'member', $userId, null, ['status_id' => $statusId]);

            // Notification for accepted member
            if ($statusId == 1) {
                require_once __DIR__ . '/NotificationManager.php';
                (new NotificationManager())->create($userId, 'membership_accepted', "¡Bienvenido! Tu solicitud de ingreso ha sido aceptada.", '/');
            }
        } else {
            Debug::error("PEOPLE_STATUS_UPDATE_FAILED | UserID: $userId | StatusID: $statusId");
        }
        return $success;
    }

    /**
     * Eliminar un miembro permanentemente
     */
    public function deleteMember($memberId)
    {
        try {
            $this->db->beginTransaction();

            // 1. Borrar tokens de invitación
            $stmtToken = $this->db->prepare("DELETE FROM invitation_tokens WHERE member_id = ?");
            $stmtToken->execute([$memberId]);

            // 2. Borrar cuenta de usuario (limpia sesiones en cascada por DB)
            $stmtAcc = $this->db->prepare("DELETE FROM user_accounts WHERE member_id = ?");
            $stmtAcc->execute([$memberId]);

            // 3. Borrar registros de asistencia o calendario (limpios por CASCADE en DB mayormente, pero por seguridad)
            // 4. Borrar miembro (Esto disparará el resto de CASCADE)
            $stmtM = $this->db->prepare("DELETE FROM member WHERE id = ?");
            $success = $stmtM->execute([$memberId]);

            if ($success) {
                $this->db->commit();
                Debug::log("PEOPLE_DELETE_SUCCESS | MemberID: $memberId");
                $this->activity->log(null, null, 'user.delete', 'member', $memberId);
            } else {
                $this->db->rollBack();
                Debug::error("PEOPLE_DELETE_FAILED | MemberID: $memberId");
            }
            return $success;

        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            Debug::error("PEOPLE_DELETE_ERROR | MemberID: $memberId | Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Detectar URL base dinámicamente
     */
    private function getBaseUrl()
    {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
        $host = $_SERVER['HTTP_HOST'];

        // Si estamos detrás de un proxy (como en un entorno de dev Vite/PHP mixto o balanceador),
        // intentamos usar X-Forwarded-Host si existe.
        if (isset($_SERVER['HTTP_X_FORWARDED_HOST'])) {
            $host = $_SERVER['HTTP_X_FORWARDED_HOST'];
        }

        return $protocol . $host;
    }

    /**
     * Invitar a alguien (Crea registro en member, genera token y envía email)
     */
    public function invite($name, $email, $roleId, $inviterChurchId)
    {
        require_once __DIR__ . '/EmailManager.php';
        $emailManager = new EmailManager();

        // 1. Check if member already exists
        $check = $this->db->prepare("SELECT id, name, status_id FROM member WHERE email = :email");
        $check->execute([':email' => $email]);
        $existingMember = $check->fetch();

        if ($existingMember) {
            // Check if they are already registered (have a user account)
            $stmtUser = $this->db->prepare("SELECT id FROM user_accounts WHERE member_id = ?");
            $stmtUser->execute([$existingMember['id']]);
            $hasAccount = $stmtUser->fetch();

            if ($hasAccount) {
                // User is already registered. 
                // We just need to ensure they are in the church if needed, or just return success with a "Registered" flag.
                // In this modular vision, we might just be assigning them to a team.
                Debug::log("INVITE_EXISTING_USER | Email: $email | ID: " . $existingMember['id']);

                // Get church name
                $churchStmt = $this->db->prepare("SELECT name FROM church WHERE id = ?");
                $churchStmt->execute([$inviterChurchId]);
                $church = $churchStmt->fetch();
                $churchName = $church['name'] ?? 'Tu Iglesia';

                // Send "Team Assignment" email instead of registration email
                $sent = $emailManager->sendTeamAssignment($email, $existingMember['name'], 'un nuevo equipo', $churchName);

                return [
                    'success' => true,
                    'already_registered' => true,
                    'member_id' => $existingMember['id'],
                    'email_sent' => $sent
                ];
            } else {
                // Member exists but no account (maybe a previous invite expired or was deleted?)
                // Handle as resend or new invite
                Debug::log("INVITE_MEMBER_EXISTS_NO_ACCOUNT | Email: $email");
                return $this->resendInvitation($email);
            }
        }

        try {
            $this->db->beginTransaction();

            // 2. Obtener datos de la iglesia para el mail
            $churchStmt = $this->db->prepare("SELECT name FROM church WHERE id = ?");
            $churchStmt->execute([$inviterChurchId]);
            $church = $churchStmt->fetch();
            $churchName = $church['name'] ?? 'Tu Iglesia';

            // 3. Insertar en member (status_id 3 = pending)
            $sql = "INSERT INTO member (name, email, role_id, status_id, church_id) VALUES (:name, :email, :rid, 3, :cid)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':name' => $name,
                ':email' => $email,
                ':rid' => $roleId,
                ':cid' => $inviterChurchId
            ]);
            $memberId = $this->db->lastInsertId();

            // 4. Generar Token de Invitación
            $token = bin2hex(random_bytes(32));
            $expires = date('Y-m-d H:i:s', strtotime('+48 hours'));

            $sqlToken = "INSERT INTO invitation_tokens (member_id, token, expires_at) VALUES (:mid, :token, :expires)";
            $stmtToken = $this->db->prepare($sqlToken);
            $stmtToken->execute([
                ':mid' => $memberId,
                ':token' => $token,
                ':expires' => $expires
            ]);

            // 5. Obtener nombre del Rol para el mail
            $roleStmt = $this->db->prepare("SELECT display_name FROM roles WHERE id = ?");
            $roleStmt->execute([$roleId]);
            $roleInfo = $roleStmt->fetch();
            $roleDisplayName = $roleInfo['display_name'] ?? 'Miembro';

            // 6. Enviar Email
            // URL base dinámica
            $baseUrl = $this->getBaseUrl();
            $inviteUrl = "$baseUrl/accept-invite?token=$token";

            $sent = $emailManager->sendInvitation($email, $name, $roleDisplayName, $inviteUrl, $churchName);

            $this->db->commit();
            Debug::log("INVITE_SEND_SUCCESS | To: $email | Name: $name | Role: $roleDisplayName | EmailSent: " . ($sent ? 'YES' : 'NO') . " | URL: $inviteUrl");
            $this->activity->log($inviterChurchId, null, 'user.invite', 'member', $memberId, null, ['email' => $email]);
            return ['success' => true, 'email_sent' => $sent];

        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            Debug::error("INVITE_SEND_FAILED | To: $email | Error: " . $e->getMessage() . " | Stack: " . $e->getTraceAsString());
            return ['success' => false, 'error' => 'Hubo un error al enviar la invitación: ' . $e->getMessage()];
        }
    }

    /**
     * Reenviar invitación (actualiza token y envía mail)
     */
    public function resendInvitation($email)
    {
        require_once __DIR__ . '/EmailManager.php';
        $emailManager = new EmailManager();

        try {
            // 1. Obtener datos del miembro
            $sql = "SELECT id, name, church_id FROM member WHERE email = :email AND status_id = 3";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':email' => $email]);
            $member = $stmt->fetch();

            if (!$member) {
                return ['success' => false, 'error' => 'No se encontró una invitación pendiente para este email.'];
            }

            $memberId = $member['id'];
            $name = $member['name'];
            $churchId = $member['church_id'];

            // 2. Obtener nombre de la iglesia
            $churchStmt = $this->db->prepare("SELECT name FROM church WHERE id = ?");
            $churchStmt->execute([$churchId]);
            $church = $churchStmt->fetch();
            $churchName = $church['name'] ?? 'Tu Iglesia';

            // 3. Generar nuevo Token
            $token = bin2hex(random_bytes(32));
            $expires = date('Y-m-d H:i:s', strtotime('+48 hours'));

            // Actualizar o Insertar Token (UPSERT manual)
            $this->db->prepare("DELETE FROM invitation_tokens WHERE member_id = ?")->execute([$memberId]);
            $sqlToken = "INSERT INTO invitation_tokens (member_id, token, expires_at) VALUES (:mid, :token, :expires)";
            $stmtToken = $this->db->prepare($sqlToken);
            $stmtToken->execute([
                ':mid' => $memberId,
                ':token' => $token,
                ':expires' => $expires
            ]);

            // 4. Enviar mail
            $baseUrl = $this->getBaseUrl();
            $inviteUrl = "$baseUrl/accept-invite?token=$token";
            $sent = $emailManager->sendInvitation($email, $name, 'Miembro', $inviteUrl, $churchName);

            Debug::log("INVITE_RESEND_SUCCESS | To: $email | EmailSent: " . ($sent ? 'YES' : 'NO') . " | URL: $inviteUrl");
            return ['success' => true, 'email_sent' => $sent];

        } catch (Exception $e) {
            Debug::error("INVITE_RESEND_FAILED | To: $email | Error: " . $e->getMessage());
            return ['success' => false, 'error' => 'Error al reenviar invitación.'];
        }
    }

    /**
     * Eliminar invitación pendiente
     */
    public function deleteInvitation($email)
    {
        try {
            $this->db->beginTransaction();

            $sql = "SELECT id FROM member WHERE email = :email AND status_id = 3";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':email' => $email]);
            $member = $stmt->fetch();

            if (!$member) {
                return ['success' => false, 'error' => 'No se encontró la invitación pendiente.'];
            }

            $memberId = $member['id'];

            // 1. Borrar token
            $this->db->prepare("DELETE FROM invitation_tokens WHERE member_id = ?")->execute([$memberId]);

            // 2. Borrar miembro
            $this->db->prepare("DELETE FROM member WHERE id = ?")->execute([$memberId]);

            $this->db->commit();
            Debug::log("INVITE_DELETE_SUCCESS | Email: $email");
            $this->activity->log(null, null, 'user.invite_delete', 'member', $memberId, ['email' => $email]);
            return ['success' => true];

        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            Debug::error("INVITE_DELETE_FAILED | Email: $email | Error: " . $e->getMessage());
            return ['success' => false, 'error' => 'Error al eliminar invitación.'];
        }
    }

    /**
     * Verificar un token de invitación
     */
    public function verifyInvitation($token)
    {
        $sql = "
            SELECT it.*, m.name, m.email, c.name as church_name 
            FROM invitation_tokens it
            JOIN member m ON it.member_id = m.id
            JOIN church c ON m.church_id = c.id
            WHERE it.token = :token AND it.expires_at > NOW()
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':token' => $token]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    public function getRoles()
    {
        $sql = "SELECT id, name, display_name as displayName, level FROM roles WHERE is_hidden = 0 ORDER BY level ASC";
        return $this->db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAreas($churchId = null)
    {
        $sql = "SELECT id, name FROM area WHERE (:cid IS NULL OR church_id = :cid2)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':cid' => $churchId, ':cid2' => $churchId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function addArea($churchId, $name)
    {
        $sql = "INSERT INTO area (church_id, name) VALUES (:cid, :name)";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':cid' => $churchId, ':name' => $name]);
    }

    public function getGroups($churchId = null, $areaId = null)
    {
        $sql = "
            SELECT g.id, g.name, g.description, g.is_service_team, g.leader_id, m.name as leader_name, g.area_id, a.name as area_name
            FROM `group` g
            LEFT JOIN member m ON g.leader_id = m.id
            LEFT JOIN area a ON g.area_id = a.id
            WHERE (:cid1 IS NULL OR g.church_id = :cid2 OR g.church_id IS NULL)
            AND (:aid1 IS NULL OR g.area_id = :aid2)
            ORDER BY g.name ASC
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':cid1' => $churchId,
            ':cid2' => $churchId,
            ':aid1' => $areaId,
            ':aid2' => $areaId
        ]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function joinGroup($memberId, $groupId)
    {
        try {
            $stmt = $this->db->prepare("INSERT IGNORE INTO member_group (member_id, group_id) VALUES (?, ?)");
            $success = $stmt->execute([$memberId, $groupId]);
            if ($success) {
                // Get church ID for the group
                $stmtC = $this->db->prepare("SELECT church_id FROM `group` WHERE id = ?");
                $stmtC->execute([$groupId]);
                $cid = $stmtC->fetchColumn();
                $this->activity->log($cid, $memberId, 'group.join', 'group', $groupId);
            }
            return $success;
        } catch (Exception $e) {
            Debug::error("JOIN_GROUP_FAILED | Member: $memberId | Group: $groupId | Error: " . $e->getMessage());
            return false;
        }
    }

    public function getAllInstruments()
    {
        $stmt = $this->db->prepare("SELECT id, name, code, category FROM instruments ORDER BY name ASC");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function saveInstruments($memberId, $instrumentIds)
    {
        try {
            $this->db->beginTransaction();
            // Clear current instruments
            $stmtDel = $this->db->prepare("DELETE FROM member_instruments WHERE member_id = ?");
            $stmtDel->execute([$memberId]);

            // Insert new ones
            if (!empty($instrumentIds)) {
                $stmtIns = $this->db->prepare("INSERT INTO member_instruments (member_id, instrument_id) VALUES (?, ?)");
                foreach ($instrumentIds as $instId) {
                    $stmtIns->execute([$memberId, $instId]);
                }
            }
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            Debug::error("SAVE_INSTRUMENTS_FAILED | Member: $memberId | Error: " . $e->getMessage());
            return false;
        }
    }
    public function addGroup($churchId, $name, $leaderId = null, $areaId = null, $description = '', $isServiceTeam = true)
    {
        $sql = "INSERT INTO `group` (church_id, name, leader_id, area_id, description, is_service_team) VALUES (:cid, :name, :lid, :aid, :desc, :ist)";
        $stmt = $this->db->prepare($sql);
        $success = $stmt->execute([
            ':cid' => $churchId,
            ':name' => $name,
            ':lid' => $leaderId,
            ':aid' => $areaId,
            ':desc' => $description,
            ':ist' => $isServiceTeam ? 1 : 0
        ]);
        if ($success) {
            $groupId = $this->db->lastInsertId();
            $this->activity->log($churchId, null, 'group.create', 'group', $groupId, null, ['name' => $name]);
        }
        return $success;
    }

    public function deleteGroup($churchId, $groupId)
    {
        $sql = "DELETE FROM `group` WHERE id = :gid AND church_id = :cid";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':gid' => $groupId, ':cid' => $churchId]);
    }

    public function assignTeamBulk($churchId, $groupId, $memberIds)
    {
        try {
            $this->db->beginTransaction();
            // Clear current members if requested? For now, just add.
            // Or maybe the user wants to sync? Let's go with sync:

            // 1. Remove all current members
            $stmtDel = $this->db->prepare("DELETE FROM member_group WHERE group_id = ?");
            $stmtDel->execute([$groupId]);

            // 2. Insert new ones
            if (!empty($memberIds)) {
                $stmtIns = $this->db->prepare("INSERT INTO member_group (member_id, group_id) VALUES (?, ?)");
                foreach ($memberIds as $mid) {
                    $stmtIns->execute([$mid, $groupId]);
                }
            }
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            Debug::error("BULK_ASSIGN_FAILED | Group: $groupId | Error: " . $e->getMessage());
            return false;
        }
    }

    public function getMembersByGroupId($churchId, $groupId)
    {
        $sql = "
            SELECT m.id, m.name, m.email
            FROM member m
            JOIN member_group mg ON m.id = mg.member_id
            WHERE mg.group_id = :gid AND (m.church_id = :cid OR m.church_id IS NULL)
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':gid' => $groupId, ':cid' => $churchId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function approveUser($memberId, $roleId, $churchId, $groupIds = [], $areaIds = [])
    {
        try {
            $this->db->beginTransaction();

            // 1. Update Member status to Active (1) and set Role
            $stmt = $this->db->prepare("UPDATE member SET status_id = 1, role_id = :rid WHERE id = :mid AND church_id = :cid");
            $stmt->execute([
                ':rid' => $roleId,
                ':mid' => $memberId,
                ':cid' => $churchId
            ]);

            // 2. Activate User Account
            $stmtUA = $this->db->prepare("UPDATE user_accounts SET is_active = 1 WHERE member_id = :mid");
            $stmtUA->execute([':mid' => $memberId]);

            // 3. Assign Groups
            if (!empty($groupIds)) {
                $this->db->prepare("DELETE FROM member_group WHERE member_id = ?")->execute([$memberId]);
                $stmtGroup = $this->db->prepare("INSERT INTO member_group (member_id, group_id) VALUES (?, ?)");
                foreach ($groupIds as $groupId) {
                    $stmtGroup->execute([$memberId, $groupId]);
                }
            }

            // 4. Assign Areas
            if (!empty($areaIds)) {
                $this->db->prepare("DELETE FROM member_area WHERE member_id = ?")->execute([$memberId]);
                $stmtArea = $this->db->prepare("INSERT INTO member_area (member_id, area_id) VALUES (?, ?)");
                foreach ($areaIds as $areaId) {
                    $stmtArea->execute([$memberId, $areaId]);
                }
            }

            // 5. Send Notification to user (Optional but good)
            require_once __DIR__ . '/NotificationManager.php';
            $notif = new NotificationManager();
            $notif->create($memberId, 'account_approved', '¡Bienvenido! Tu cuenta ha sido aprobada. Ya puedes acceder a todas las funciones.', '/dashboard');

            $this->db->commit();
            Debug::log("USER_APPROVE_SUCCESS | Member: $memberId | Role: $roleId");
            return ['success' => true];
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            Debug::error("USER_APPROVE_FAILED | Member: $memberId | Error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function assignMemberToTeam($memberId, $teamId, $roleInGroup = 'member', $churchId)
    {
        try {
            $this->db->beginTransaction();

            // 1. Remove from other service teams if we want unique service team assignment? 
            // The user said "Los roles pertenezcan siempre a un Equipo".
            // Let's assume a member belongs to one main team for now to simplify, or just UPSERT.

            $sql = "INSERT INTO member_group (member_id, group_id, role_in_group) 
                    VALUES (:mid, :gid, :role) 
                    ON DUPLICATE KEY UPDATE role_in_group = :role";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':mid' => $memberId,
                ':gid' => $teamId,
                ':role' => $roleInGroup
            ]);

            // Update the main member role to 'leader' or 'member' based on this?
            // Usually, there's a global role (id 5 = Miembro, etc).
            // If assigned as leader, we might want to elevate their global role too.
            $roleId = ($roleInGroup === 'leader' || $roleInGroup === 'coordinator') ? 3 : 5; // Assuming 3 is leader level
            $this->db->prepare("UPDATE member SET role_id = ? WHERE id = ? AND church_id = ?")->execute([$roleId, $memberId, $churchId]);

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            if ($this->db->inTransaction())
                $this->db->rollBack();
            Debug::error("ASSIGN_TEAM_FAILED | Member: $memberId | Team: $teamId | Error: " . $e->getMessage());
            return false;
        }
    }
    public function updateMemberProfile($memberId, $churchId, $data)
    {
        try {
            $this->db->beginTransaction();

            // 1. Update Role
            if (isset($data['roleId'])) {
                $stmt = $this->db->prepare("UPDATE member SET role_id = ? WHERE id = ? AND church_id = ?");
                $stmt->execute([$data['roleId'], $memberId, $churchId]);
            }

            // 2. Update Groups
            if (isset($data['groups'])) {
                // Clear current groups
                $this->db->prepare("DELETE FROM member_group WHERE member_id = ?")->execute([$memberId]);

                // Insert new ones
                if (!empty($data['groups'])) {
                    $stmtGroup = $this->db->prepare("INSERT INTO member_group (member_id, group_id) VALUES (?, ?)");
                    foreach ($data['groups'] as $groupId) {
                        $stmtGroup->execute([$memberId, $groupId]);
                    }
                }

                // 3. Logic for Instrument Notification Trigger
                // (Already exists in original code)
                $musicStmt = $this->db->prepare("SELECT id FROM `group` WHERE (name LIKE '%Alabanza%' OR name LIKE '%Musica%') AND (church_id = ? OR church_id IS NULL) LIMIT 1");
                $musicStmt->execute([$churchId]);
                $musicGroupId = $musicStmt->fetchColumn();

                if ($musicGroupId && in_array($musicGroupId, $data['groups'])) {
                    $instCheck = $this->db->prepare("SELECT COUNT(*) FROM member_instruments WHERE member_id = ?");
                    $instCheck->execute([$memberId]);
                    if ($instCheck->fetchColumn() == 0) {
                        require_once __DIR__ . '/NotificationManager.php';
                        $notif = new NotificationManager();
                        $notif->create($memberId, 'instrument_request', 'Te damos la bienvenida al equipo de Alabanza! Por favor completa tu perfil con los instrumentos que tocas.', '/profile');
                    }
                }
            }

            // 3. Update Areas
            if (isset($data['areaIds'])) {
                $this->db->prepare("DELETE FROM member_area WHERE member_id = ?")->execute([$memberId]);
                if (!empty($data['areaIds'])) {
                    $stmtArea = $this->db->prepare("INSERT INTO member_area (member_id, area_id) VALUES (?, ?)");
                    foreach ($data['areaIds'] as $areaId) {
                        $stmtArea->execute([$memberId, $areaId]);
                    }
                }
            }

            $this->db->commit();
            Debug::log("MEMBER_PROFILE_UPDATE_SUCCESS | Member: $memberId | By: Admin");
            $this->activity->log($churchId, null, 'user.profile_update', 'member', $memberId);
            return ['success' => true];
        } catch (Exception $e) {
            if ($this->db->inTransaction())
                $this->db->rollBack();
            Debug::error("MEMBER_PROFILE_UPDATE_FAILED | Member: $memberId | Error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
    public function getMemberAreas($memberId)
    {
        $sql = "SELECT area_id FROM member_area WHERE member_id = :mid";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':mid' => $memberId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function getMembersByGroupName($churchId, $groupName)
    {
        $sql = "
            SELECT 
                m.id, 
                m.name, 
                m.email, 
                m.phone,
                m.church_id,
                r.name as role_name,
                r.display_name as role_display,
                s.name as status
            FROM `member` m
            JOIN `member_group` mg ON m.id = mg.member_id
            JOIN `group` g ON mg.group_id = g.id
            LEFT JOIN `roles` r ON m.role_id = r.id
            LEFT JOIN `status` s ON m.status_id = s.id
            WHERE (m.church_id = :cid OR m.church_id IS NULL)
            AND g.name LIKE :gname
            AND r.name != 'master'
            ORDER BY m.name ASC
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':cid' => $churchId,
            ':gname' => "%$groupName%"
        ]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Obtener miembros de los equipos liderados por una persona
     */
    public function getMembersByLeaderId($churchId, $leaderId)
    {
        // 1. Get Groups led by this leader
        $sqlGroups = "SELECT id FROM `group` WHERE leader_id = :lid AND church_id = :cid";
        $stmtGroups = $this->db->prepare($sqlGroups);
        $stmtGroups->execute([':lid' => $leaderId, ':cid' => $churchId]);
        $groupIds = $stmtGroups->fetchAll(PDO::FETCH_COLUMN);

        if (empty($groupIds)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($groupIds), '?'));

        $sql = "
            SELECT DISTINCT
                m.id, 
                m.name, 
                m.email, 
                m.phone,
                m.church_id,
                r.name as role_name,
                r.display_name as role_display,
                s.name as status,
                g.name as group_name
            FROM `member` m
            JOIN `member_group` mg ON m.id = mg.member_id
            JOIN `group` g ON mg.group_id = g.id
            LEFT JOIN `roles` r ON m.role_id = r.id
            LEFT JOIN `status` s ON m.status_id = s.id
            WHERE mg.group_id IN ($placeholders)
            AND r.name != 'master'
            ORDER BY m.name ASC
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($groupIds);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Invitación masiva por email
     */
    public function inviteBulk($emails, $inviterChurchId)
    {
        require_once __DIR__ . '/EmailManager.php';
        $emailManager = new EmailManager();

        // Obtener datos de la iglesia
        $churchStmt = $this->db->prepare("SELECT name FROM church WHERE id = ?");
        $churchStmt->execute([$inviterChurchId]);
        $church = $churchStmt->fetch();
        $churchName = $church['name'] ?? 'Tu Iglesia';

        $baseUrl = $this->getBaseUrl();
        $results = [
            'total' => count($emails),
            'success' => 0,
            'failed' => 0,
            'errors' => []
        ];

        foreach ($emails as $email) {
            $email = trim($email);
            if (empty($email))
                continue;

            try {
                $this->db->beginTransaction();

                // 1. Verificar si ya existe
                $check = $this->db->prepare("SELECT id FROM member WHERE email = :email");
                $check->execute([':email' => $email]);
                if ($check->fetch()) {
                    $results['failed']++;
                    $results['errors'][] = "$email: Already registered.";
                    $this->db->rollBack();
                    continue;
                }

                // 2. Insertar en member (status_id 3 = pending, role_id 5 = member)
                $sql = "INSERT INTO member (name, email, role_id, status_id, church_id) VALUES (:name, :email, 5, 3, :cid)";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([
                    ':name' => explode('@', $email)[0], // Use email prefix as name for bulk
                    ':email' => $email,
                    ':cid' => $inviterChurchId
                ]);
                $memberId = $this->db->lastInsertId();

                // 3. Generar Token
                $token = bin2hex(random_bytes(32));
                $expires = date('Y-m-d H:i:s', strtotime('+72 hours'));
                $this->db->prepare("INSERT INTO invitation_tokens (member_id, token, expires_at) VALUES (?, ?, ?)")
                    ->execute([$memberId, $token, $expires]);

                // 4. Enviar Email
                $inviteUrl = "$baseUrl/accept-invite?token=$token";
                $sent = $emailManager->sendInvitation($email, explode('@', $email)[0], 'Miembro', $inviteUrl, $churchName);

                $this->db->commit();
                $results['success']++;
                $this->activity->log($inviterChurchId, null, 'user.invite_bulk', 'member', $memberId, null, ['email' => $email]);

            } catch (Exception $e) {
                if ($this->db->inTransaction())
                    $this->db->rollBack();
                $results['failed']++;
                $results['errors'][] = "$email: " . $e->getMessage();
            }
        }

        return $results;
    }
}
?>