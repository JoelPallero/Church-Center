<?php

namespace App\Repositories;

use App\Database;
use PDO;
use App\Helpers\Logger;

class UserRepo
{
    public static function findByEmail($email)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT u.*, m.name, m.church_id 
            FROM user_accounts u
            JOIN member m ON u.member_id = m.id
            WHERE u.email = ? AND u.is_active = 1
        ");
        $stmt->execute([$email]);
        return $stmt->fetch();
    }

    public static function getMemberData($memberId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM member WHERE id = ?");
        $stmt->execute([$memberId]);
        $member = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($member) {
            $member['instruments'] = self::getUserInstruments($memberId);
            $member['areas'] = self::getUserAreas($memberId);

            // Get role
            $stmt = $db->prepare("
                SELECT r.id, r.name, r.display_name as displayName
                FROM roles r
                JOIN user_service_roles usr ON r.id = usr.role_id
                JOIN services s ON usr.service_id = s.id
                WHERE usr.member_id = ? AND s.key = 'mainhub'
            ");
            $stmt->execute([$memberId]);
            $member['role'] = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        return $member;
    }

    public static function getUserInstruments($memberId)
    {
        $db = Database::getInstance();
        try {
            $stmt = $db->prepare("
                SELECT i.* 
                FROM instruments i
                JOIN member_instruments mi ON i.id = mi.instrument_id
                WHERE mi.member_id = ?
            ");
            $stmt->execute([$memberId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return [];
        }
    }

    public static function setUserInstruments($memberId, $instrumentIds)
    {
        $db = Database::getInstance();
        try {
            $db->beginTransaction();

            // Delete old ones
            $stmt = $db->prepare("DELETE FROM member_instruments WHERE member_id = ?");
            $stmt->execute([$memberId]);

            // Insert new ones
            if (!empty($instrumentIds)) {
                $sql = "INSERT INTO member_instruments (member_id, instrument_id) VALUES ";
                $placeholders = [];
                $params = [];
                foreach ($instrumentIds as $id) {
                    $placeholders[] = "(?, ?)";
                    $params[] = $memberId;
                    $params[] = $id;
                }
                $sql .= implode(", ", $placeholders);
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
            }

            $db->commit();
            return true;
        } catch (\Exception $e) {
            if ($db->inTransaction())
                $db->rollBack();
            return false;
        }
    }

    public static function findById($memberId)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT u.*, r.name as role_name 
            FROM user_accounts u
            LEFT JOIN user_global_roles ugr ON u.member_id = ugr.member_id
            LEFT JOIN roles r ON ugr.role_id = r.id
            WHERE u.member_id = ? AND u.is_active = 1
        ");
        $stmt->execute([$memberId]);
        return $stmt->fetch();
    }

    public static function getAllWithChurch($churchId = null)
    {
        $db = Database::getInstance();
        $sql = "
            SELECT m.id, m.church_id, m.name, m.surname, m.email, m.phone, m.status, m.can_create_teams, usr.role_id, r.name as role_name, r.display_name as role_display, c.name as church_name
            FROM member m
            LEFT JOIN church c ON m.church_id = c.id
            LEFT JOIN services s ON s.key = 'mainhub'
            LEFT JOIN user_service_roles usr ON m.id = usr.member_id AND (m.church_id = usr.church_id OR m.church_id IS NULL) AND usr.service_id = s.id
            LEFT JOIN roles r ON usr.role_id = r.id
            WHERE m.status != 'deleted'
        ";
        $params = [];
        if ($churchId) {
            $sql .= " AND m.church_id = ?";
            $params[] = $churchId;
        }
        $sql .= " ORDER BY m.id DESC";
        try {
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
        } catch (\PDOException $e) {
            if (strpos($e->getMessage(), "Unknown column") !== false && strpos($e->getMessage(), "can_create_teams") !== false) {
                $db->exec("ALTER TABLE member ADD COLUMN can_create_teams TINYINT(1) DEFAULT 0;");
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
            } else {
                throw $e;
            }
        }
        
        $users = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Fetch areas and instruments for each user (inefficient but safe for small volumes, or use a better join)
        foreach ($users as &$u) {
            $u['areas'] = self::getUserAreas($u['id']);
            $u['instruments'] = self::getUserInstruments($u['id']);
            // Standardize role display
            if (isset($u['role_display'])) {
                $u['role'] = [
                    'id' => (int)($u['role_id'] ?? 0),
                    'name' => $u['role_name'],
                    'displayName' => $u['role_display']
                ];
            }
        }

        return $users;
    }

    public static function createMember($data)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            INSERT INTO member (church_id, name, surname, email, phone, status, invite_token, token_expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['church_id'] ?? null,
            $data['name'],
            $data['surname'] ?? '',
            $data['email'],
            $data['phone'] ?? null,
            $data['status'] ?? 'pending',
            $data['invite_token'] ?? null,
            $data['token_expires_at'] ?? null
        ]);
        return $db->lastInsertId();
    }

    public static function updateStatus($memberId, $status)
    {
        $db = Database::getInstance();
        $stmt = $db->prepare("UPDATE member SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $memberId]);
    }

    public static function assignRole($memberId, $churchId, $roleId, $serviceKey = 'mainhub')
    {
        $db = Database::getInstance();

        // 1. Get service ID
        $sStmt = $db->prepare("SELECT id FROM services WHERE `key` = ?");
        $sStmt->execute([$serviceKey]);
        $serviceId = $sStmt->fetchColumn();

        if (!$serviceId)
            return false;

        // 2. Assign in user_service_roles
        $stmt = $db->prepare("
            INSERT INTO user_service_roles (member_id, church_id, service_id, role_id)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE role_id = VALUES(role_id)
        ");
        return $stmt->execute([$memberId, $churchId, $serviceId, $roleId]);
    }

    public static function updateMemberRole($memberId, $roleId)
    {
        $member = self::getMemberData($memberId);
        if (!$member)
            return false;

        $churchId = $member['church_id'] ?? null;
        if ($churchId === null) {
            // Check if it's a global role like 'superadmin'
            $db = Database::getInstance();
            $stmt = $db->prepare("SELECT name FROM roles WHERE id = ?");
            $stmt->execute([(int)$roleId]);
            $roleName = $stmt->fetchColumn();
            if ($roleName === 'superadmin') {
                return $db->prepare("INSERT INTO user_global_roles (member_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE role_id = role_id")
                    ->execute([$memberId, $roleId]);
            }
            Logger::warning("UserRepo::updateMemberRole - Cannot assign church-level role without church_id for MemberID: $memberId");
            return false;
        }

        return self::assignRole($memberId, $churchId, $roleId, 'mainhub');
    }

    public static function hardDelete($memberId)
    {
        $db = Database::getInstance();
        try {
            $db->beginTransaction();
            $db->prepare("DELETE FROM user_service_roles WHERE member_id = ?")->execute([$memberId]);
            $db->prepare("DELETE FROM user_accounts WHERE member_id = ?")->execute([$memberId]);
            $db->prepare("DELETE FROM group_members WHERE member_id = ?")->execute([$memberId]);
            $result = $db->prepare("DELETE FROM member WHERE id = ?")->execute([$memberId]);
            $db->commit();
            return $result;
        } catch (\Exception $e) {
            if ($db->inTransaction())
                $db->rollBack();
            throw $e;
        }
    }

    public static function deleteInvitation($email)
    {
        $db = Database::getInstance();
        return $db->prepare("DELETE FROM member WHERE email = ? AND status = 'pending'")->execute([$email]);
    }

    public static function updateProfile($memberId, $data)
    {
        $db = Database::getInstance();
        $fields = [];
        $params = [];

        Logger::info("UserRepo::updateProfile starting for MemberID: $memberId", ['data' => $data]);

        if (isset($data['name'])) {
            $fields[] = "name = ?";
            $params[] = $data['name'];
        }
        if (isset($data['surname'])) {
            $fields[] = "surname = ?";
            $params[] = $data['surname'];
        }
        if (isset($data['lastName'])) {
            $fields[] = "surname = ?";
            $params[] = $data['lastName'];
        }
        if (isset($data['phone'])) {
            $fields[] = "phone = ?";
            $params[] = $data['phone'];
        }
        if (isset($data['sex'])) {
            $fields[] = "sex = ?";
            $params[] = $data['sex'];
        }
        
        if (isset($data['can_create_teams'])) {
            $fields[] = "can_create_teams = ?";
            $params[] = $data['can_create_teams'] ? 1 : 0;
        }
        
        $newChurchId = null;
        if (isset($data['churchId']) || isset($data['church_id'])) {
            $newChurchId = $data['churchId'] ?? $data['church_id'];
            $fields[] = "church_id = ?";
            $params[] = $newChurchId ? (int)$newChurchId : null;
        }

        try {
            $db->beginTransaction();

            if (!empty($fields)) {
                $params[] = $memberId;
                $sql = "UPDATE member SET " . implode(", ", $fields) . " WHERE id = ?";
                Logger::info("UserRepo::updateProfile - Executing query: $sql with params: " . json_encode($params));
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                
                if ($stmt->rowCount() === 0) {
                    Logger::warning("UserRepo::updateProfile - No rows affected by the UPDATE member query. MemberID: $memberId");
                }
            }

            // Handle Role
            if (isset($data['roleId'])) {
                $roleId = (int) $data['roleId'];
                // Use newChurchId if provided, otherwise fetch current
                $targetChurchId = $newChurchId;
                if ($targetChurchId === null) {
                    $mStmt = $db->prepare("SELECT church_id FROM member WHERE id = ?");
                    $mStmt->execute([$memberId]);
                    $targetChurchId = $mStmt->fetchColumn();
                }

                if ($targetChurchId !== null && $targetChurchId !== false) {
                    Logger::info("UserRepo::updateProfile - Assigning Role $roleId for Church $targetChurchId");
                    self::assignRole($memberId, (int)$targetChurchId, $roleId, 'mainhub');
                } else {
                    Logger::warning("UserRepo::updateProfile - Could not determine church_id for role assignment. MemberID: $memberId");
                    // If it's a superadmin role, maybe assign globally?
                    $rStmt = $db->prepare("SELECT name FROM roles WHERE id = ?");
                    $rStmt->execute([$roleId]);
                    if ($rStmt->fetchColumn() === 'superadmin') {
                        $db->prepare("INSERT INTO user_global_roles (member_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE role_id=role_id")->execute([$memberId, $roleId]);
                    }
                }
            }

            // Handle Areas
            if (isset($data['areaIds'])) {
                self::setUserAreas($memberId, $data['areaIds']);
            }

            // Handle Instruments
            if (isset($data['instruments'])) {
                self::setUserInstruments($memberId, $data['instruments']);
            }

            // Handle Groups
            if (isset($data['groups'])) {
                self::setUserGroups($memberId, $data['groups']);
            }

            $db->commit();
            Logger::info("UserRepo::updateProfile successfully completed for MemberID: $memberId");
            return true;
        } catch (\Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            Logger::error("UserRepo::updateProfile failed for MemberID: $memberId. Error: " . $e->getMessage());
            return false;
        }
    }

    public static function setUserGroups($memberId, $groupIds)
    {
        $db = Database::getInstance();
        try {
            $db->beginTransaction();
            // Clear current non-leader groups or all? 
            // Usually editors want full sync.
            $stmt = $db->prepare("DELETE FROM group_members WHERE member_id = ?");
            $stmt->execute([$memberId]);

            if (!empty($groupIds)) {
                $sql = "INSERT INTO group_members (member_id, group_id, role_in_group) VALUES ";
                $placeholders = [];
                $params = [];
                foreach ($groupIds as $id) {
                    $placeholders[] = "(?, ?, 'member')";
                    $params[] = (int) $memberId;
                    $params[] = (int) $id;
                }
                $sql .= implode(", ", $placeholders);
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
            }
            $db->commit();
            return true;
        } catch (\Exception $e) {
            if ($db->inTransaction())
                $db->rollBack();
            return false;
        }
    }

    public static function getUserAreas($memberId)
    {
        $db = Database::getInstance();
        try {
            $stmt = $db->prepare("
                SELECT a.id, a.name 
                FROM areas a
                JOIN member_areas ma ON a.id = ma.area_id
                WHERE ma.member_id = ?
            ");
            $stmt->execute([$memberId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return [];
        }
    }

    public static function setUserAreas($memberId, $areaIds)
    {
        $db = Database::getInstance();
        try {
            $db->beginTransaction();
            $stmt = $db->prepare("DELETE FROM member_areas WHERE member_id = ?");
            $stmt->execute([$memberId]);

            if (!empty($areaIds)) {
                $sql = "INSERT INTO member_areas (member_id, area_id) VALUES ";
                $placeholders = [];
                $params = [];
                foreach ($areaIds as $id) {
                    $placeholders[] = "(?, ?)";
                    $params[] = (int) $memberId;
                    $params[] = (int) $id;
                }
                $sql .= implode(", ", $placeholders);
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
            }
            $db->commit();
            return true;
        } catch (\Exception $e) {
            if ($db->inTransaction())
                $db->rollBack();
            return false;
        }
    }

    public static function findByInviteToken($rawToken)
    {
        $tokenHash = hash('sha256', $rawToken);
        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT m.*, c.name as church_name 
            FROM member m
            LEFT JOIN church c ON m.church_id = c.id
            WHERE m.invite_token = ? AND m.token_expires_at > NOW() AND m.status = 'pending'
        ");
        $stmt->execute([$tokenHash]);
        return $stmt->fetch();
    }

    public static function updateSettings($memberId, $data)
    {
        $db = Database::getInstance();
        $fields = [];
        $params = [];
        if (isset($data['theme'])) {
            $fields[] = "default_theme = ?";
            $params[] = $data['theme'];
        }
        if (isset($data['language'])) {
            $fields[] = "default_language = ?";
            $params[] = $data['language'];
        }
        if (isset($data['google_calendar_id'])) {
            $fields[] = "google_calendar_id = ?";
            $params[] = $data['google_calendar_id'];
        }
        if (isset($data['google_api_key'])) {
            $fields[] = "google_api_key = ?";
            $params[] = $data['google_api_key'];
        }

        if (!empty($fields)) {
            $params[] = $memberId;
            $sql = "UPDATE user_accounts SET " . implode(", ", $fields) . " WHERE member_id = ?";
            return $db->prepare($sql)->execute($params);
        }
        return false;
    }

    public static function completeInvitation($memberId, $password)
    {
        $db = Database::getInstance();
        try {
            $db->beginTransaction();

            // 1. Get member data
            $member = self::getMemberData($memberId);
            if (!$member)
                throw new \Exception("Member not found");

            // 2. Create user account
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $db->prepare("
                INSERT INTO user_accounts (member_id, email, password_hash, auth_method, is_active)
                VALUES (?, ?, ?, 'password', 1)
                ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), is_active = 1
            ");
            $stmt->execute([$memberId, $member['email'], $passwordHash]);

            // 3. Update member status and clear token
            $stmt = $db->prepare("
                UPDATE member 
                SET status = 'active', invite_token = NULL, token_expires_at = NULL 
                WHERE id = ?
            ");
            $stmt->execute([$memberId]);

            $db->commit();
            return true;
        } catch (\Exception $e) {
            if ($db->inTransaction())
                $db->rollBack();
            \App\Helpers\Logger::error("UserRepo::completeInvitation error: " . $e->getMessage());
            return false;
        }
    }
}
