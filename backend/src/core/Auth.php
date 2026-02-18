<?php
/**
 * Clase de Autenticación Unificada (Refactorizada)
 * Adaptada para el esquema unificado (Multi-tenant, Strict types)
 */

require_once __DIR__ . '/../../config/Database.php';
require_once __DIR__ . '/Debug.php';

class Auth
{
    private $db;
    private $jwtSecret;
    private $sessionTimeout;
    private $maxLoginAttempts;
    private $lockDuration;
    private $activity;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
        if (class_exists('Bootstrapper')) {
            Bootstrapper::require('core', 'ActivityManager');
        } else {
            require_once __DIR__ . '/ActivityManager.php';
        }
        $this->activity = new ActivityManager();
        $this->loadSecuritySettings();
    }

    public function getDb()
    {
        return $this->db;
    }

    /**
     * Cargar configuraciones de seguridad GLOBALES (church_id IS NULL)
     */
    private function loadSecuritySettings()
    {
        if (!$this->db) {
            if (class_exists('Debug')) {
                Debug::error("Auth::loadSecuritySettings | Database connection is NULL");
            }
            return;
        }
        try {
            $stmt = $this->db->query("
                SELECT setting_key, setting_value 
                FROM settings 
                WHERE church_id IS NULL 
                AND setting_key IN ('jwt_secret', 'session_timeout', 'max_login_attempts', 'lock_duration')
            ");

            $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

            $this->jwtSecret = $settings['jwt_secret'] ?? 'CHANGE_ME_IM_DEFAULT';
            $this->sessionTimeout = (int) ($settings['session_timeout'] ?? 3600);
            $this->maxLoginAttempts = (int) ($settings['max_login_attempts'] ?? 5);
            $this->lockDuration = (int) ($settings['lock_duration'] ?? 1800);
        } catch (PDOException $e) {
            throw new Exception("Security Error: Failed to load security settings. " . $e->getMessage());
        }
    }

    /**
     * Login de usuario (Unificado)
     */
    public function login($email, $password, $ipAddress = null, $userAgent = null)
    {

        // Validar entrada
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'error' => 'Invalid email format'];
        }

        // Buscar usuario e información básica de su iglesia
        $sql = "
            SELECT 
                ua.id as user_id, 
                ua.member_id, 
                ua.password_hash, 
                ua.locked_until, 
                ua.failed_login_attempts,
                ua.default_theme,
                ua.default_language,
                m.name, 
                m.email as member_email, 
                m.church_id,
                c.slug as church_slug
            FROM user_accounts ua
            JOIN member m ON ua.member_id = m.id
            JOIN church c ON m.church_id = c.id
            WHERE ua.email = :email AND ua.is_active = TRUE
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            // Timing attack protection
            password_verify('dummy', '$2y$10$dummyhashdummyhashdummyhashdummyhashdummyhash');
            Debug::security("Failed login attempt: User not found ($email)");
            return ['success' => false, 'error' => 'Usuario o contraseña errónea'];
        }

        // Check Lock
        if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
            Debug::security("Blocked login attempt: Account locked for $email until {$user['locked_until']}");
            return [
                'success' => false,
                'error' => 'La cuenta está bloqueada temporalmente por seguridad.'
            ];
        }

        // Verify Password
        if (!password_verify($password, $user['password_hash'])) {
            $this->handleFailedLogin($user['user_id'], $user['failed_login_attempts']);
            Debug::security("Failed login attempt: Incorrect password for $email");
            return ['success' => false, 'error' => 'Usuario o contraseña errónea'];
        }

        // Success
        $this->resetFailedAttempts($user['user_id']);

        // Fetch User Services & Roles
        $services = $this->getUserServices($user['member_id']);

        // Generate Token
        // The token now contains core identity, specific service roles should be checked on request
        $tokenData = [
            'uid' => $user['user_id'],
            'mid' => $user['member_id'],
            'cid' => $user['church_id'],
            'cslug' => $user['church_slug']
        ];

        $accessToken = $this->generateJWT($tokenData);
        $refreshToken = bin2hex(random_bytes(32));

        // Store Session
        $this->storeSession($user['user_id'], $accessToken, $refreshToken, $ipAddress, $userAgent);

        Debug::security("FULL_LOGIN_SUCCESS | User: {$user['name']} (ID: {$user['member_id']}) | Email: {$email} | CID: " . ($user['church_id'] ?? 'NULL'));

        return [
            'success' => true,
            'user' => [
                'id' => $user['member_id'],
                'name' => $user['name'],
                'email' => $user['member_email'],
                'church_id' => $user['church_id'],
                'church_slug' => $user['church_slug'],
                'services' => $services,
                'default_theme' => $user['default_theme'],
                'default_language' => $user['default_language']
            ],
            'token' => $accessToken,
            'refresh_token' => $refreshToken
        ];
    }

    private function handleFailedLogin($userId, $currentAttempts)
    {
        $attempts = $currentAttempts + 1;
        $lockUntil = null;

        if ($attempts >= $this->maxLoginAttempts) {
            $lockUntil = date('Y-m-d H:i:s', time() + $this->lockDuration);
        }

        $sql = "UPDATE user_accounts 
                SET failed_login_attempts = :attempts, locked_until = :lock 
                WHERE id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':attempts' => $attempts, ':lock' => $lockUntil, ':id' => $userId]);
    }

    private function resetFailedAttempts($userId)
    {
        $sql = "UPDATE user_accounts 
                SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() 
                WHERE id = :id";
        $this->db->prepare($sql)->execute([':id' => $userId]);
    }

    private function generateJWT($payload)
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);

        $payload['iat'] = time();
        $payload['exp'] = time() + $this->sessionTimeout;

        $base64UrlHeader = $this->base64UrlEncode($header);
        $base64UrlPayload = $this->base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->jwtSecret, true);
        $base64UrlSignature = $this->base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    private function storeSession($userId, $token, $refreshToken, $ip, $ua)
    {
        // Enforce specific session expiration logic here if needed
        // For now, simpler than old code, just insert.
        $sql = "INSERT INTO session_tokens (user_id, token, refresh_token, expires_at, ip_address, user_agent)
                VALUES (:uid, :token, :refresh, DATE_ADD(NOW(), INTERVAL :timeout SECOND), :ip, :ua)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':uid' => $userId,
            ':token' => $token,
            ':refresh' => $refreshToken,
            ':timeout' => $this->sessionTimeout,
            ':ip' => $ip,
            ':ua' => $ua
        ]);
    }

    // Helper
    private function base64UrlEncode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode($data)
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Verificar Jerarquía de Roles
     * userLevel < targetLevel significa user es Superior (0=Master, 100=Member)
     */
    public function canManageUser($actorLevel, $targetLevel)
    {
        return $actorLevel < $targetLevel;
    }

    /**
     * Validar Token JWT
     */
    public function validateJWT($token)
    {

        $parts = explode('.', $token);
        if (count($parts) != 3)
            return false;

        list($head64, $payload64, $sig64) = $parts;

        $sig = $this->base64UrlDecode($sig64);
        $checkSig = hash_hmac('sha256', "$head64.$payload64", $this->jwtSecret, true);

        if (!hash_equals($checkSig, $sig))
            return false;

        $payload = json_decode($this->base64UrlDecode($payload64), true);

        if (($payload['exp'] ?? 0) < time())
            return false;

        // Check if revoked in DB
        // Optional: Cache this check to DB
        $sql = "SELECT id FROM session_tokens WHERE token = :token AND is_revoked = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':token' => $token]);

        if (!$stmt->fetch())
            return false;

        return $payload;
    }

    /**
     * Unified Auth Check
     * Extracts Bearer token from headers and validates it.
     */
    public function checkAuth()
    {
        $headers = getallheaders();
        $token = null;

        if (isset($headers['Authorization'])) {
            if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
                $token = $matches[1];
            }
        }

        if (!$token)
            return false;
        return $this->validateJWT($token);
    }

    /**
     * Obtener Permisos de un Usuario para un Servicio específico
     */
    public function getUserPermissions($memberId, $serviceKey = 'mainhub')
    {
        $sql = "
            SELECT DISTINCT p.name 
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN roles r ON r.id = rp.role_id
            JOIN users_services us ON us.role_id = r.id
            JOIN services s ON us.service_id = s.id
            WHERE us.user_id = :mid 
            AND s.key = :service 
            AND us.enabled = 1
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':mid' => $memberId,
            ':service' => $serviceKey
        ]);

        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * Obtener Servicios habilitados para un usuario
     */
    public function getUserServices($memberId)
    {
        $sql = "
            SELECT 
                s.key, 
                s.name as service_name,
                r.name as role_name,
                r.level as role_level
            FROM users_services us
            JOIN services s ON us.service_id = s.id
            LEFT JOIN roles r ON us.role_id = r.id
            WHERE us.user_id = :mid AND us.enabled = 1
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':mid' => $memberId]);

        $services = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $services[$row['key']] = [
                'name' => $row['service_name'],
                'role' => $row['role_name'],
                'level' => (int) $row['role_level']
            ];
        }
        return $services;
    }

    /**
     * Verificar Acceso Contextual
     */
    public function checkAccess($memberId, $churchId, $serviceKey)
    {
        $sql = "
            SELECT us.id 
            FROM users_services us
            JOIN services s ON us.service_id = s.id
            WHERE us.user_id = :mid 
            AND us.church_id = :cid 
            AND s.key = :service 
            AND us.enabled = 1
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':mid' => $memberId,
            ':cid' => $churchId,
            ':service' => $serviceKey
        ]);
        return (bool) $stmt->fetch();
    }

    /**
     * Obtener todos los roles
     */
    public function getAllRoles()
    {
        $sql = "SELECT id, name, display_name, description, level FROM roles WHERE is_hidden = 0 ORDER BY level ASC";
        return $this->db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Obtener todos los permisos disponibles
     */
    public function getAllPermissions()
    {
        $sql = "SELECT id, name, display_name, module, description FROM permissions ORDER BY module ASC, display_name ASC";
        return $this->db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Obtener IDs de permisos para un rol específico
     */
    public function getPermissionsByRole($roleId)
    {
        $sql = "SELECT permission_id FROM role_permissions WHERE role_id = :rid";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':rid' => $roleId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * Actualizar mapeo de Permisos de un Rol
     */
    public function updateRolePermissions($roleId, $permissionIds)
    {
        try {
            $this->db->beginTransaction();

            // 1. Borrar anteriores
            $stmt = $this->db->prepare("DELETE FROM role_permissions WHERE role_id = ?");
            $stmt->execute([$roleId]);

            // 2. Insertar nuevos
            if (!empty($permissionIds)) {
                $sqlInsert = "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)";
                $stmtInsert = $this->db->prepare($sqlInsert);
                foreach ($permissionIds as $pId) {
                    $stmtInsert->execute([$roleId, $pId]);
                }
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            Debug::error("updateRolePermissions failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtener Datos de Usuario
     */
    public function getUserById($memberId)
    {
        $sql = "
            SELECT 
                ua.member_id as id, 
                m.name, 
                m.email, 
                m.church_id,
                c.slug as church_slug,
                ua.default_theme,
                ua.default_language
            FROM user_accounts ua
            JOIN member m ON ua.member_id = m.id
            JOIN church c ON m.church_id = c.id
            WHERE ua.member_id = :mid
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':mid' => $memberId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user)
            return null;

        return [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'church_id' => $user['church_id'],
            'church_slug' => $user['church_slug'],
            'services' => $this->getUserServices($memberId),
            'default_theme' => $user['default_theme'],
            'default_language' => $user['default_language']
        ];
    }

    /**
     * Paso 2 & 3: Intercambiar CODE por Token y Perfil
     */
    public function exchangeCodeForToken($code, $redirectUri)
    {
        // 1. Intercambiar CODE por Access Token
        $ch = curl_init("https://oauth2.googleapis.com/token");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'code' => $code,
            'client_id' => Database::getInstance()->getConfig('GOOGLE_CLIENT_ID'),
            'client_secret' => Database::getInstance()->getConfig('GOOGLE_CLIENT_SECRET'),
            'redirect_uri' => $redirectUri,
            'grant_type' => 'authorization_code'
        ]));

        $response = curl_exec($ch);
        curl_close($ch);
        $tokenData = json_decode($response, true);

        if (isset($tokenData['error'])) {
            return ['success' => false, 'error' => 'Exchange failed: ' . $tokenData['error_description']];
        }

        // 2. Obtener Perfil del Usuario
        $accessToken = $tokenData['access_token'];
        $ch = curl_init("https://www.googleapis.com/oauth2/v3/userinfo");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $accessToken"]);
        $profileResponse = curl_exec($ch);
        curl_close($ch);

        $profile = json_decode($profileResponse, true);

        if (!$profile || !isset($profile['email'])) {
            return ['success' => false, 'error' => 'Failed to fetch profile'];
        }

        return ['success' => true, 'profile' => $profile];
    }

    /**
     * Finalizar Login Google tras verificar perfil
     */
    public function googleLoginByEmail($email)
    {
        $sql = "
            SELECT 
                ua.id as user_id, 
                ua.member_id, 
                ua.default_theme,
                ua.default_language,
                m.name, 
                m.email as member_email, 
                m.church_id,
                c.slug as church_slug
            FROM user_accounts ua
            JOIN member m ON ua.member_id = m.id
            JOIN church c ON m.church_id = c.id
            WHERE ua.email = :email AND ua.is_active = TRUE
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            return ['success' => false, 'error' => 'not_registered', 'email' => $email];
        }

        $tokenData = [
            'uid' => $user['user_id'],
            'mid' => $user['member_id'],
            'cid' => $user['church_id'],
            'cslug' => $user['church_slug']
        ];

        $accessToken = $this->generateJWT($tokenData);
        $refreshToken = bin2hex(random_bytes(32));

        $this->storeSession($user['user_id'], $accessToken, $refreshToken, $_SERVER['REMOTE_ADDR'] ?? null, $_SERVER['HTTP_USER_AGENT'] ?? null);

        return [
            'success' => true,
            'token' => $accessToken,
            'user' => [
                'id' => $user['member_id'],
                'name' => $user['name'],
                'email' => $user['member_email'],
                'church_id' => $user['church_id'],
                'church_slug' => $user['church_slug'],
                'services' => $this->getUserServices($user['member_id'])
            ]
        ];
    }

    /**
     * Login con Google (ID Token Legacy o Verificado)
     */
    public function googleLogin($credential)
    {
        // 1. Verificar Token con Google APIs usando cURL
        $ch = curl_init("https://oauth2.googleapis.com/tokeninfo?id_token=" . $credential);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        curl_close($ch);

        $data = json_decode($response, true);

        if (!$data || isset($data['error'])) {
            return ['success' => false, 'error' => 'Invalid Google Credential'];
        }

        // Verificar el Client ID (aud)
        if ($data['aud'] !== Database::getInstance()->getConfig('GOOGLE_CLIENT_ID')) {
            return ['success' => false, 'error' => 'Security Error: App ID Mismatch'];
        }

        $email = $data['email'];

        // 2. Buscar usuario en nuestra DB por email
        $sql = "
            SELECT 
                ua.id as user_id, 
                ua.member_id, 
                ua.default_theme,
                ua.default_language,
                m.name, 
                m.email as member_email, 
                m.church_id,
                c.slug as church_slug
            FROM user_accounts ua
            JOIN member m ON ua.member_id = m.id
            JOIN church c ON m.church_id = c.id
            WHERE ua.email = :email AND ua.is_active = TRUE
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            return [
                'success' => false,
                'error' => 'Usted no tiene una cuenta con nosotros. Por favor, pida una invitación primero.',
                'email' => $email
            ];
        }

        // 3. Generar Sesión igual que el login normal
        $tokenData = [
            'uid' => $user['user_id'],
            'mid' => $user['member_id'],
            'cid' => $user['church_id'],
            'cslug' => $user['church_slug']
        ];

        $accessToken = $this->generateJWT($tokenData);
        $refreshToken = bin2hex(random_bytes(32));

        $this->storeSession($user['user_id'], $accessToken, $refreshToken, $_SERVER['REMOTE_ADDR'] ?? null, $_SERVER['HTTP_USER_AGENT'] ?? null);

        return [
            'success' => true,
            'user' => [
                'id' => $user['member_id'],
                'name' => $user['name'],
                'email' => $user['member_email'],
                'church_id' => $user['church_id'],
                'church_slug' => $user['church_slug'],
                'services' => $this->getUserServices($user['member_id']),
                'default_theme' => $user['default_theme'],
                'default_language' => $user['default_language']
            ],
            'token' => $accessToken,
            'refresh_token' => $refreshToken
        ];
    }

    /**
     * Registro de nuevo usuario (Extendido)
     */
    public function register($data)
    {
        $name = $data->name;
        $email = $data->email;
        $surname = $data->surname ?? '';
        $phone = $data->phone ?? '';
        $serviceArea = $data->service_area ?? '';
        $churchId = $data->church_id ?? null;
        $instrumentIds = $data->instrument_ids ?? [];
        $leaderId = $data->leader_id ?? null;
        $password = $data->password ?? 'Master2024!';

        try {
            $this->db->beginTransaction();

            // 1. Crear Miembro
            $sqlMember = "INSERT INTO member (name, email, surname, phone, service_area, church_id, role_id, status_id, leader_id) 
                          VALUES (:name, :email, :surname, :phone, :area, :cid, 6, 3, :lid)"; // Status 3 = Pending, Role 6 = Guest
            $stmt = $this->db->prepare($sqlMember);
            $stmt->execute([
                ':name' => $name,
                ':email' => $email,
                ':surname' => $surname,
                ':phone' => $phone,
                ':area' => $serviceArea,
                ':cid' => $churchId,
                ':lid' => $leaderId
            ]);
            $memberId = $this->db->lastInsertId();

            // 2. Crear Cuenta de Usuario
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $this->db->prepare("INSERT INTO user_accounts (member_id, email, password_hash, auth_method_id, is_active) VALUES (:mid, :email, :hash, 1, FALSE)");
            $stmt->execute([':mid' => $memberId, ':email' => $email, ':hash' => $hash]);

            // 3. Notificar Administradores (Master y Pastor)
            if (class_exists('Bootstrapper')) {
                Bootstrapper::require('core', 'NotificationManager');
            } else {
                require_once __DIR__ . '/NotificationManager.php';
            }
            $notif = new NotificationManager();

            // Buscar pastores de la iglesia o masters
            $stmtAdmins = $this->db->prepare("
                SELECT m.id FROM member m 
                JOIN roles r ON m.role_id = r.id 
                WHERE (m.church_id = :cid AND r.name = 'pastor') 
                OR r.name = 'master'
            ");
            $stmtAdmins->execute([':cid' => $churchId]);
            $admins = $stmtAdmins->fetchAll(PDO::FETCH_COLUMN);

            foreach ($admins as $adminId) {
                $notif->create($adminId, 'user_registration', "Nuevo usuario registrado: $name. Pendiente de aprobación.", '/people');
            }

            // 4. Guardar Instrumentos si es músico
            if (!empty($instrumentIds) && $serviceArea === 'musician') {
                foreach ($instrumentIds as $instId) {
                    $stmtInst = $this->db->prepare("INSERT INTO member_instruments (member_id, instrument_id) VALUES (?, ?)");
                    $stmtInst->execute([$memberId, $instId]);
                }
            }

            $this->db->commit();
            Debug::log("USER_REGISTER_SUCCESS | Name: $name | Email: $email | CID: " . ($churchId ?? 'NULL'));
            $this->activity->log($churchId, null, 'user.register', 'member', $memberId, null, ['email' => $email]);
            return ['success' => true, 'user_id' => $memberId];
        } catch (Exception $e) {
            $this->db->rollBack();
            Debug::error("USER_REGISTER_FAILED | Email: $email | Error: " . $e->getMessage());
            return ['success' => false, 'error' => 'Hubo un error al procesar el registro. Por favor verifique los datos o intente más tarde.'];
        }
    }

    /**
     * Registro Automático como GUEST (Auto-login vía Google)
     */
    public function selfRegisterGuest($name, $email)
    {
        try {
            $this->db->beginTransaction();

            // 1. Crear Miembro (Role 6 = Guest, Status 3 = Pending for Approval)
            // Se asocia a church_id 1 por defecto (o el sistema decida)
            $sqlMember = "INSERT INTO member (name, email, church_id, role_id, status_id) 
                          VALUES (:name, :email, 1, 6, 3)";
            $stmt = $this->db->prepare($sqlMember);
            $stmt->execute([
                ':name' => $name,
                ':email' => $email
            ]);
            $memberId = $this->db->lastInsertId();

            // 2. Crear Cuenta de Usuario (Auth Method 2 = Google)
            // Se crea como is_active = FALSE porque el miembro está PENDIENTE
            $stmt = $this->db->prepare("INSERT INTO user_accounts (member_id, email, auth_method_id, is_active) VALUES (:mid, :email, 2, FALSE)");
            $stmt->execute([':mid' => $memberId, ':email' => $email]);

            $this->db->commit();
            Debug::log("SELF_REGISTER_GUEST_SUCCESS | Email: $email");
            $this->activity->log(1, null, 'user.register_guest', 'member', $memberId, null, ['email' => $email]);
            return ['success' => true, 'member_id' => $memberId];
        } catch (Exception $e) {
            $this->db->rollBack();
            Debug::error("SELF_REGISTER_GUEST_FAILED | Email: $email | Error: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Eliminar Perfil (Solo para GUESTS o usuarios sin equipos)
     */
    public function deleteProfile($memberId)
    {
        try {
            // Verificar si tiene grupos/equipos
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM member_group WHERE member_id = ?");
            $stmt->execute([$memberId]);
            if ($stmt->fetchColumn() > 0) {
                return ['success' => false, 'error' => 'No puedes eliminar tu perfil si ya eres parte de un equipo. Contacta a un administrador.'];
            }

            $this->db->beginTransaction();
            // Borrar cuenta de usuario
            $stmt = $this->db->prepare("DELETE FROM user_accounts WHERE member_id = ?");
            $stmt->execute([$memberId]);
            // Borrar miembro
            $stmt = $this->db->prepare("DELETE FROM member WHERE id = ?");
            $stmt->execute([$memberId]);

            $this->db->commit();
            return ['success' => true];
        } catch (Exception $e) {
            $this->db->rollBack();
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Obtener líderes de alabanza para una iglesia
     */
    public function getWorshipLeaders($churchId)
    {
        $sql = "SELECT m.id, m.name FROM member m 
                JOIN roles r ON m.role_id = r.id 
                WHERE m.church_id = :cid AND r.name IN ('leader', 'pastor')";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':cid' => $churchId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Completar registro desde invitación
     */
    public function completeRegistration($memberId, $password)
    {
        try {
            $this->db->beginTransaction();

            // 1. Crear Cuenta de Usuario
            $hash = password_hash($password, PASSWORD_DEFAULT);

            // Obtener email del miembro
            $stmtM = $this->db->prepare("SELECT email FROM member WHERE id = ?");
            $stmtM->execute([$memberId]);
            $m = $stmtM->fetch();
            $email = $m['email'];

            $sqlUA = "INSERT INTO user_accounts (member_id, email, password_hash, auth_method_id, is_active) VALUES (:mid, :email, :hash, 1, TRUE)";
            $stmtUA = $this->db->prepare($sqlUA);
            $stmtUA->execute([
                ':mid' => $memberId,
                ':email' => $email,
                ':hash' => $hash
            ]);

            // 2. Mantener Miembro en PENDIENTE
            // Eliminamos la activación automática: $stmtUpd = $this->db->prepare("UPDATE member SET status_id = 1 WHERE id = ?");
            // El miembro se queda con status_id = 3 (Pending) que ya tenía de la invitación.
            // La cuenta de usuario se creó como is_active = TRUE en el paso anterior para permitir el flujo,
            // pero el PeopleManager::getAll() o el Auth::login() filtran por status_id del miembro si es necesario,
            // o simplemente forzamos account->is_active = FALSE según política.
            // Para cumplir con "quiero que se mantengan siempre en pendiente", desactivamos la cuenta también.
            $this->db->prepare("UPDATE user_accounts SET is_active = 0 WHERE member_id = ?")->execute([$memberId]);

            // 3. Eliminar Token
            $stmtDel = $this->db->prepare("DELETE FROM invitation_tokens WHERE member_id = ?");
            $stmtDel->execute([$memberId]);

            $this->db->commit();
            Debug::log("INVITE_COMPLETE_SUCCESS | MemberID: $memberId | Email: $email");
            $this->activity->log($user['church_id'] ?? null, $memberId, 'user.invite_accept', 'member', $memberId, null, ['email' => $email]);

            // Fetch full user info to generate token
            $user = $this->getUserById($memberId);
            $tokenData = [
                'uid' => $memberId, // User account ID would be better but mid is used in many places
                'mid' => $memberId,
                'cid' => $user['church_id'],
                'role' => $user['role']['name'],
                'level' => $user['role']['level']
            ];
            $token = $this->generateJWT($tokenData);
            $this->storeSession($memberId, $token, bin2hex(random_bytes(32)), $_SERVER['REMOTE_ADDR'] ?? null, $_SERVER['HTTP_USER_AGENT'] ?? null);

            return [
                'success' => true,
                'user' => $user,
                'token' => $token
            ];
        } catch (Exception $e) {
            $this->db->rollBack();
            Debug::error("INVITE_COMPLETE_FAILED | MemberID: $memberId | Error: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Solicitar recuperación de contraseña
     */
    public function requestPasswordReset($email)
    {
        // 1. Verificar si el usuario existe
        $stmt = $this->db->prepare("SELECT id FROM user_accounts WHERE email = :email AND is_active = TRUE");
        $stmt->execute([':email' => $email]);
        if (!$stmt->fetch()) {
            // Por seguridad, no decimos si el correo existe o no a menos que sea necesario.
            // Pero el usuario pidió un mensaje específico: "El usuario ingresado no existe."
            return ['success' => false, 'error' => 'El usuario ingresado no existe.'];
        }

        // 2. Generar Token
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + 86400); // 24hs

        // 3. Guardar Token (limpiar anteriores primero)
        $this->db->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);
        $sqlInsert = "INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)";
        $this->db->prepare($sqlInsert)->execute([$email, $token, $expires]);

        // 4. Enviar Email
        require_once __DIR__ . '/EmailManager.php';
        $emailManager = new EmailManager();

        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
        $host = $_SERVER['HTTP_HOST'];
        if (isset($_SERVER['HTTP_X_FORWARDED_HOST'])) {
            $host = $_SERVER['HTTP_X_FORWARDED_HOST'];
        }
        $resetUrl = "$protocol$host/reset-password?token=$token";

        // Obtener nombre del miembro
        $stmtName = $this->db->prepare("SELECT m.name FROM member m JOIN user_accounts ua ON m.id = ua.member_id WHERE ua.email = ?");
        $stmtName->execute([$email]);
        $user = $stmtName->fetch();
        $name = $user['name'] ?? 'Usuario';

        $sent = $emailManager->sendPasswordReset($email, $name, $resetUrl);

        return ['success' => true, 'email_sent' => $sent];
    }

    /**
     * Restablecer contraseña con Token
     */
    public function resetPassword($token, $newPassword)
    {
        // 1. Validar Token
        $stmt = $this->db->prepare("SELECT email FROM password_resets WHERE token = ? AND expires_at > NOW()");
        $stmt->execute([$token]);
        $reset = $stmt->fetch();

        if (!$reset) {
            return ['success' => false, 'error' => 'El enlace de restauración es inválido o ha expirado.'];
        }

        $email = $reset['email'];

        // 2. Actualizar Contraseña
        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $update = $this->db->prepare("UPDATE user_accounts SET password_hash = :hash WHERE email = :email");
        $success = $update->execute([':hash' => $hash, ':email' => $email]);

        if ($success) {
            // 3. Limpiar Token
            $this->db->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);
            Debug::security("PASSWORD_RESET_SUCCESS | Email: $email");
            return ['success' => true];
        }

        return ['success' => false, 'error' => 'No se pudo actualizar la contraseña.'];
    }

    /**
     * Actualizar Configuración de Usuario
     */
    public function updateUserSettings($memberId, $theme, $lang)
    {
        $sql = "UPDATE user_accounts SET default_theme = ?, default_language = ? WHERE member_id = ?";
        return $this->db->prepare($sql)->execute([$theme, $lang, $memberId]);
    }
}
?>