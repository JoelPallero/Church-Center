-- ============================================================
-- MinistryHub: DATABASE MASTER SCHEMA (FULL INSTALLATION FROM SCRATCH)
-- ============================================================
DROP DATABASE IF EXISTS `database_schema_master`;
CREATE DATABASE `database_schema_master`;
USE `database_schema_master`;

-- Architecture: Multi-Hub SaaS (Contextual Roles & Global Auth)
-- Consolidate: Core + Calendar + Multi-Hub + Permissions + Seeds

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. DROP EXISTING TABLES
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS session_tokens;
DROP TABLE IF EXISTS user_accounts;
DROP TABLE IF EXISTS auth_methods;
DROP TABLE IF EXISTS user_calendar_integrations;
DROP TABLE IF EXISTS meeting_team_assignments;
DROP TABLE IF EXISTS meeting_setlists;
DROP TABLE IF EXISTS meeting_instances;
DROP TABLE IF EXISTS meeting_recurring_patterns;
DROP TABLE IF EXISTS playlist_items;
DROP TABLE IF EXISTS playlists;
DROP TABLE IF EXISTS meetings;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS song_member_keys;
DROP TABLE IF EXISTS song_versions;
DROP TABLE IF EXISTS songs;
DROP TABLE IF EXISTS invitation_tokens;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS member_group; -- Legacy
DROP TABLE IF EXISTS `group`;
DROP TABLE IF EXISTS member_instruments;
DROP TABLE IF EXISTS instruments;
DROP TABLE IF EXISTS users_services;
DROP TABLE IF EXISTS member;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS status;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS church;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS role_permissions;

-- 2. CORE & MULTI-TENANCY
CREATE TABLE church (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    timezone VARCHAR(100) DEFAULT 'America/Argentina/Buenos_Aires',
    logo_url VARCHAR(500),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(50) UNIQUE NOT NULL, -- 'worship', 'social', 'mainhub', etc.
    name VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NULL, -- NULL = Global role, INT = Specific to service
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INT NOT NULL DEFAULT 100,
    is_system_role BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    UNIQUE INDEX idx_role_name_service (name, service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. DOMAIN: MEMBERS & ACCESS
CREATE TABLE member (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NOT NULL,
    status_id INT,
    name VARCHAR(255) NOT NULL,
    surname VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    photo_url VARCHAR(500),
    birth_date DATE,
    address TEXT,
    leader_id INT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES status(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES member(id) ON DELETE SET NULL,
    FOREIGN KEY (leader_id) REFERENCES member(id) ON DELETE SET NULL,
    INDEX idx_member_email (email),
    INDEX idx_member_church (church_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    service_id INT NOT NULL,
    church_id INT NOT NULL,
    role_id INT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES member(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_service_church (user_id, service_id, church_id),
    INDEX idx_us_user (user_id),
    INDEX idx_us_service (service_id),
    INDEX idx_us_church (church_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE area (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NOT NULL,
    service_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `group` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NOT NULL,
    area_id INT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_service_team BOOLEAN DEFAULT TRUE,
    leader_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES area(id) ON DELETE SET NULL,
    FOREIGN KEY (leader_id) REFERENCES member(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    role_in_group VARCHAR(50) DEFAULT 'member', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `group`(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES member(id) ON DELETE CASCADE,
    UNIQUE KEY (group_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE instruments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NULL, 
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE,
    category VARCHAR(50), 
    FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE member_instruments (
    member_id INT NOT NULL,
    instrument_id INT NOT NULL,
    skill_level INT DEFAULT 1,
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (member_id, instrument_id),
    FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. MUSIC DOMAIN
CREATE TABLE songs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    master_song_id INT NOT NULL,
    church_id INT NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES member(id) ON DELETE SET NULL,
    INDEX idx_church_master (church_id, master_song_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE song_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    song_id INT NOT NULL,
    arrangement_notes TEXT,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES member(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE song_member_keys (
    song_id INT NOT NULL,
    member_id INT NOT NULL,
    preferred_key VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (song_id, member_id),
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. OPERATIONAL CALENDAR DATA
CREATE TABLE meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_type ENUM('recurrent', 'special') DEFAULT 'special',
    status ENUM('scheduled', 'cancelled', 'completed') DEFAULT 'scheduled',
    location VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES member(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE meeting_recurring_patterns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT NOT NULL,
    recurrence_type ENUM('weekly') DEFAULT 'weekly',
    day_of_week TINYINT NOT NULL, 
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone VARCHAR(100) DEFAULT 'UTC',
    repeat_until DATE NULL,
    active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE meeting_instances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NOT NULL,
    meeting_id INT NOT NULL,
    instance_date DATE NOT NULL,
    start_datetime_utc DATETIME NOT NULL,
    end_datetime_utc DATETIME NOT NULL,
    status ENUM('scheduled', 'cancelled', 'completed') DEFAULT 'scheduled',
    override_data JSON NULL,
    is_generated BOOLEAN DEFAULT TRUE,   -- CAMBIO: 'generated' → 'is_generated'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    UNIQUE KEY unique_instance (meeting_id, instance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE playlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NOT NULL,
    meeting_id INT NULL, 
    name VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES member(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE playlist_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playlist_id INT NOT NULL,
    song_id INT NOT NULL,
    song_key VARCHAR(10), 
    order_index INT DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE meeting_setlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NOT NULL,
    meeting_instance_id INT NOT NULL,
    setlist_id INT NOT NULL, 
    assigned_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
    FOREIGN KEY (meeting_instance_id) REFERENCES meeting_instances(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES member(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE meeting_team_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NOT NULL,
    meeting_instance_id INT NOT NULL,
    member_id INT NOT NULL,
    role VARCHAR(100), 
    instrument_id INT NULL, 
    is_replacement BOOLEAN DEFAULT FALSE,
    replaces_member_id INT NULL,
    status ENUM('assigned', 'confirmed', 'declined') DEFAULT 'assigned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
    FOREIGN KEY (meeting_instance_id) REFERENCES meeting_instances(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
    FOREIGN KEY (replaces_member_id) REFERENCES member(id) ON DELETE SET NULL,
    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_calendar_integrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, 
    provider VARCHAR(50) DEFAULT 'google',
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP NULL,
    calendar_id VARCHAR(255),
    sync_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES member(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_provider (user_id, provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. AUTH & LOGS
CREATE TABLE auth_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    method VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    auth_method_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    default_theme VARCHAR(20) DEFAULT 'dark',
    default_language VARCHAR(10) DEFAULT 'es',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
    FOREIGN KEY (auth_method_id) REFERENCES auth_methods(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE session_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token TEXT NOT NULL,
    refresh_token VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_revoked TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invitation_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'todo', 
    due_date DATE,
    assigned_to INT,
    FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES member(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NULL, 
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    UNIQUE KEY (church_id, setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NOT NULL,
    recipient_id INT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES member(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NULL,
    user_id INT,
    action VARCHAR(255) NOT NULL, 
    entity_type VARCHAR(100),
    entity_id INT,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. SEED DATA (INSTALACIÓN)
-- Iglesias
INSERT INTO church (id, name, slug) VALUES (1, 'Cita con la Vida', 'cita-con-la-vida');

-- Servicios (Hubs)
INSERT INTO services (`id`, `key`, `name`, `description`) VALUES 
(1, 'mainhub', 'Church Center', 'Administración central y perfiles'),
(2, 'worship', 'Ministry Hub', 'Gestión de música y alabanza'),
(3, 'social', 'SM Hub', 'Gestión de redes sociales y comunicación');

-- Roles
INSERT INTO roles (id, service_id, name, display_name, description, level, is_system_role) VALUES
(1, NULL, 'master', 'Super Administrador', 'Control total del SaaS', 0, TRUE),
(2, NULL, 'pastor', 'Pastor / Administrador local', 'Control total de la congregación', 10, TRUE),
(3, 2, 'leader', 'Líder de Ministerio', 'Gestión de equipos y música', 30, TRUE),
(4, 2, 'coordinator', 'Coordinador', 'Gestión operativa del área', 40, TRUE),
(5, NULL, 'member', 'Miembro / Voluntario', 'Acceso básico', 100, TRUE),
(6, NULL, 'guest', 'Invitado', 'Usuario recién registrado sin equipo asignado', 200, TRUE);

-- Permisos
INSERT INTO permissions (name, display_name, module, description) VALUES
('users.manage', 'Gestión de Usuarios', 'people', 'Permite administrar miembros y sus cuentas'),
('songs.manage', 'Gestión de Canciones', 'songs', 'Permite administrar la biblioteca de cantos'),
('songs.create', 'Alta de canciones', 'songs', 'Permite crear nuevas canciones'),
('songs.edit', 'Editar canciones', 'songs', 'Permite modificar contenido de canciones'),
('songs.delete', 'Eliminar canciones', 'songs', 'Permite borrar canciones'),
('meetings.manage', 'Gestión de Reuniones', 'meeting', 'Permite administrar calendarios'),
('calendar.manage', 'Gestionar reuniones y patrones', 'calendar', 'Permite configurar eventos recurrentes'),
('calendar.assign', 'Asignar equipos y canciones', 'calendar', 'Permite programar personal y música'),
('calendar.confirm', 'Confirmar asistencia', 'calendar', 'Permite a miembros confirmar su servicio'),
('teams.create', 'Alta de equipos', 'people', 'Permite crear ministerios'),
('teams.edit', 'Editar equipos', 'people', 'Permite modificar configuración de grupos'),
('teams.delete', 'Eliminar equipos', 'people', 'Permite borrar equipos'),
('people.create', 'Alta de personas', 'people', 'Permite registrar nuevos miembros manualmente'),
('people.edit', 'Editar personas', 'people', 'Permite modificar perfiles'),
('people.delete', 'Eliminar personas', 'people', 'Permite borrar miembros'),
('instruments.create', 'Alta de instrumentos', 'system', 'Permite registrar instrumentos'),
('instruments.edit', 'Editar instrumentos', 'system', 'Permite modificar catálogo instrumental'),
('instruments.delete', 'Eliminar instrumentos', 'system', 'Permite borrar instrumentos'),
('churches.create', 'Alta de iglesias', 'master', 'Registro de congregaciones'),
('churches.edit', 'Editar iglesias', 'master', 'Modificar datos de congregaciones'),
('churches.delete', 'Eliminar iglesias', 'master', 'Baja de iglesias'),
('settings.theme', 'Configurar colores de tema', 'system', 'Personalizar estética'),
('settings.languages', 'Idiomas habilitados', 'system', 'Habilitar idiomas'),
('settings.view', 'Ver configuraciones', 'system', 'Acceso a ajustes'),
('profile.self_delete', 'Eliminar propia cuenta', 'system', 'Borrado de perfil propio'),
('users.invite', 'Enviar invitaciones', 'people', 'Invitar miembros'),
('users.roles', 'Cambiar roles de usuarios', 'people', 'Cambio de rango'),
('audit.view', 'Ver logs de auditoría', 'system', 'Monitorización de acciones');

-- Role Permissions (Master & Pastor)
INSERT INTO role_permissions (role_id, permission_id) SELECT 1, id FROM permissions;
INSERT INTO role_permissions (role_id, permission_id) SELECT 2, id FROM permissions WHERE module != 'master';
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 6, id FROM permissions WHERE name IN ('settings.theme', 'settings.languages', 'settings.view', 'profile.self_delete');

-- Status & Auth
INSERT INTO status (id, name, description) VALUES (1, 'active', 'Activo'), (2, 'inactive', 'Inactivo'), (3, 'pending', 'Pendiente');
INSERT INTO auth_methods (id, method) VALUES (1, 'password'), (2, 'google'), (3, 'outlook');

-- Core Settings
INSERT INTO settings (setting_key, setting_value) VALUES ('jwt_secret', 'MinistryHub_SECURE_TOKEN_2024'), ('session_timeout', '3600');

-- Instruments
INSERT INTO instruments (name, code, category) VALUES ('Piano', 'piano', 'keyboard'), ('Guitarra', 'guitar', 'string'), ('Bajo', 'bass', 'string'), ('Batería', 'drums', 'percussion'), ('Voz', 'vocals', 'vocal');

-- Areas (Contextual)
INSERT INTO area (id, church_id, service_id, name) VALUES (1, 1, 2, 'Alabanza');

-- Groups (linked to Areas)
INSERT INTO `group` (church_id, area_id, name, description) VALUES (1, 1, 'Banda de Domingo', 'Música en vivo');

-- ADMIN USER (Clave: Master2024!)
INSERT INTO member (id, church_id, name, email, status_id) VALUES (1, 1, 'Administrador MSM', 'admin@system.master', 1);
INSERT INTO user_accounts (id, member_id, email, password_hash, auth_method_id, is_active) 
VALUES (1, 1, 'admin@system.master', '$2y$10$TX1G2rB68aYnKhbrTAojMOoSP/1QYs8gc3QUCsSAmIngSr9QzLKIq', 1, TRUE);

-- Grant all services to admin
INSERT INTO users_services (user_id, service_id, church_id, role_id) VALUES 
(1, 1, 1, 1), -- MainHub (Master)
(1, 2, 1, 3), -- Worship (Leader)
(1, 3, 1, 1); -- Social (Master/Deafult)

SET FOREIGN_KEY_CHECKS = 1;