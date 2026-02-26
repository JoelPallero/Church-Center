/* =========================================================
   MSM2 - ESQUEMA FINAL LIMPIO (FROM SCRATCH)
   Compatible con MySQL 8+
   ========================================================= */

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS meeting_setlists;
DROP TABLE IF EXISTS meeting_assignments;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS instruments;

DROP TABLE IF EXISTS meetings;
DROP TABLE IF EXISTS calendars;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS areas;

DROP TABLE IF EXISTS user_service_roles;
DROP TABLE IF EXISTS user_global_roles;

DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS services;

DROP TABLE IF EXISTS user_accounts;
DROP TABLE IF EXISTS member;
DROP TABLE IF EXISTS church;

SET FOREIGN_KEY_CHECKS = 1;

/* =========================================================
   1) IGLESIAS
   ========================================================= */

CREATE TABLE church (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* =========================================================
   2) MIEMBROS
   - church_id nullable para superadmin global
   ========================================================= */

CREATE TABLE member (
  id INT AUTO_INCREMENT PRIMARY KEY,
  church_id INT NULL,
  name VARCHAR(120) NOT NULL,
  surname VARCHAR(120) NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(60) NULL,
  status ENUM('active','pending','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_member_church ON member(church_id);

/* =========================================================
   3) CUENTAS (LOGIN)
   - member_id referencia a member
   ========================================================= */

CREATE TABLE user_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  auth_method ENUM('password','google') NOT NULL DEFAULT 'password',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  default_theme VARCHAR(40) NULL,
  default_language VARCHAR(10) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* =========================================================
   4) SERVICIOS (MÓDULOS / HUBS)
   ========================================================= */

CREATE TABLE services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(60) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* =========================================================
   5) ROLES
   - service_id NULL => rol global (superadmin)
   ========================================================= */

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NULL,
  name VARCHAR(60) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  level INT NOT NULL DEFAULT 100,
  is_system_role TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_roles_service_name (service_id, name),
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* =========================================================
   6) PERMISOS
   ========================================================= */

CREATE TABLE permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(90) NOT NULL UNIQUE,     -- e.g. "team.create"
  display_name VARCHAR(140) NOT NULL,
  module VARCHAR(60) NOT NULL,          -- e.g. "team"
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* =========================================================
   7) ROLE -> PERMISSIONS
   ========================================================= */

CREATE TABLE role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* =========================================================
   8) ROLES GLOBALES POR USUARIO (SUPERADMIN)
   ========================================================= */

CREATE TABLE user_global_roles (
  member_id INT NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (member_id, role_id),
  FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* =========================================================
   9) ROLES POR IGLESIA Y SERVICIO
   (un usuario puede tener roles diferentes por iglesia y servicio)
   ========================================================= */

CREATE TABLE user_service_roles (
  member_id INT NOT NULL,
  church_id INT NOT NULL,
  service_id INT NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (member_id, church_id, service_id),
  FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_usr_church ON user_service_roles(church_id);
CREATE INDEX idx_usr_member ON user_service_roles(member_id);
CREATE INDEX idx_usr_service ON user_service_roles(service_id);

/* =========================================================
   10) ÁREAS
   ========================================================= */

CREATE TABLE areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  church_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
  UNIQUE KEY uq_area_church_name (church_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_area_church ON areas(church_id);

/* =========================================================
   11) EQUIPOS
   ========================================================= */

CREATE TABLE groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  church_id INT NOT NULL,
  area_id INT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
  FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL,
  UNIQUE KEY uq_group_church_name (church_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_group_church ON groups(church_id);
CREATE INDEX idx_group_area ON groups(area_id);

/* =========================================================
   12) MIEMBROS EN EQUIPO (ROL DENTRO DEL EQUIPO)
   ========================================================= */

CREATE TABLE group_members (
  group_id INT NOT NULL,
  member_id INT NOT NULL,
  role_in_group ENUM('leader','coordinator','member') NOT NULL DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, member_id),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_group_members_role ON group_members(group_id, role_in_group);
CREATE INDEX idx_group_members_member ON group_members(member_id);

/* =========================================================
   13) CALENDARIOS + REUNIONES
   ========================================================= */

CREATE TABLE calendars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  church_id INT NOT NULL,
  group_id INT NULL,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_calendar_church ON calendars(church_id);
CREATE INDEX idx_calendar_group ON calendars(group_id);

CREATE TABLE meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  calendar_id INT NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NULL,
  location VARCHAR(255) NULL,
  created_by_member_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_member_id) REFERENCES member(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_meeting_calendar ON meetings(calendar_id);
CREATE INDEX idx_meeting_start ON meetings(start_at);

/* =========================================================
   14) NOTIFICACIONES Y AUDITORÍA
   ========================================================= */

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255) NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (member_id),
  INDEX (member_id, is_read),
  FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE meeting_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  member_id INT NOT NULL,
  role VARCHAR(60) NULL,
  instrument_id INT NULL,
  status ENUM('pending', 'confirmed', 'declined') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_meeting_member (meeting_id, member_id),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE meeting_setlists (
  meeting_id INT NOT NULL,
  playlist_id INT NOT NULL,
  assigned_by_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (meeting_id, playlist_id),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by_id) REFERENCES member(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE instruments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE,
  category VARCHAR(60) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  church_id INT NOT NULL,
  member_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NULL,
  details JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (church_id),
  INDEX (created_at),
  FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* =========================================================
   15) SEEDS (SERVICIOS, ROLES, PERMISOS, ROLE_PERMISSIONS)
   ========================================================= */

INSERT INTO services (`key`, name, description, active) VALUES
  ('church_center', 'Church Center', 'Administración general', 1),
  ('ministry_hub',  'Ministry Hub',  'Áreas y equipos', 1),
  ('sm_hub',        'SM Hub',        'Social/Media hub', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Roles
INSERT INTO roles (service_id, name, display_name, description, level, is_system_role)
VALUES (NULL, 'superadmin', 'Super Administrador', 'Control total global', 0, 1)
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- Church center roles
INSERT INTO roles (service_id, name, display_name, description, level, is_system_role)
SELECT s.id, 'pastor', 'Pastor', 'Admin de iglesia', 10, 1 FROM services s WHERE s.`key`='church_center'
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

INSERT INTO roles (service_id, name, display_name, description, level, is_system_role)
SELECT s.id, 'leader', 'Líder', 'Puede crear equipos', 20, 1 FROM services s WHERE s.`key`='church_center'
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

INSERT INTO roles (service_id, name, display_name, description, level, is_system_role)
SELECT s.id, 'coordinator', 'Coordinador', 'Coordina equipos', 30, 1 FROM services s WHERE s.`key`='church_center'
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

INSERT INTO roles (service_id, name, display_name, description, level, is_system_role)
SELECT s.id, 'member', 'Miembro', 'Acceso básico', 40, 1 FROM services s WHERE s.`key`='church_center'
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- Permisos base
INSERT INTO permissions (name, display_name, module, description) VALUES
 ('church.read', 'Ver iglesia', 'church', 'Permite ver información de iglesia'),
 ('church.update', 'Editar iglesia', 'church', 'Permite editar configuración de iglesia'),
 ('area.create', 'Crear áreas', 'area', 'Permite crear áreas'),
 ('area.update', 'Editar áreas', 'area', 'Permite editar áreas'),
 ('team.create', 'Crear equipos', 'team', 'Permite crear equipos'),
 ('team.update', 'Editar equipos', 'team', 'Permite editar equipos'),
 ('team.manage_members', 'Gestionar miembros', 'team', 'Agregar/quitar miembros'),
  ('calendar.read', 'Ver calendario', 'calendar', 'Ver calendarios'),
  ('meeting.create', 'Crear reuniones', 'calendar', 'Crear reuniones'),
  ('meeting.update', 'Editar reuniones', 'calendar', 'Editar reuniones'),
  ('song.read', 'Ver canciones', 'song', 'Ver canciones'),
  ('song.create', 'Crear canciones', 'song', 'Crear canciones'),
  ('song.approve', 'Aprobar cambios', 'song', 'Permite moderar ediciones de canciones')
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- Seeds de Instrumentos
INSERT IGNORE INTO instruments (name, category) VALUES
('Voz (Soprano)', 'Voz'), ('Voz (Contralto)', 'Voz'), ('Voz (Tenor)', 'Voz'),
('Voz (Barítono)', 'Voz'), ('Piano / Teclado', 'Teclas'), ('Guitarra Acústica', 'Cuerdas'),
('Guitarra Eléctrica', 'Cuerdas'), ('Bajo', 'Cuerdas'), ('Batería', 'Percusión'),
('Violín', 'Cuerdas'), ('Saxo', 'Vientos');

-- Asignación de permisos a PASTOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN services s ON s.id = r.service_id
JOIN permissions p
WHERE r.name='pastor'
  AND s.`key`='church_center'
  AND p.name IN (
    'church.read','church.update',
    'area.create','area.update',
    'team.create','team.update','team.manage_members',
    'calendar.read','meeting.create','meeting.update',
    'song.read','song.create','song.approve'
  )
ON DUPLICATE KEY UPDATE role_id=role_id;

-- LEADER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN services s ON s.id = r.service_id
JOIN permissions p
WHERE r.name='leader'
  AND s.`key`='church_center'
  AND p.name IN (
    'church.read',
    'team.create','team.update','team.manage_members',
    'calendar.read','meeting.create','meeting.update',
    'song.read'
  )
ON DUPLICATE KEY UPDATE role_id=role_id;

-- COORDINATOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN services s ON s.id = r.service_id
JOIN permissions p
WHERE r.name='coordinator'
  AND s.`key`='church_center'
  AND p.name IN (
    'church.read',
    'team.update',
    'calendar.read','meeting.update',
    'song.read'
  )
ON DUPLICATE KEY UPDATE role_id=role_id;

-- MEMBER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN services s ON s.id = r.service_id
JOIN permissions p
WHERE r.name='member'
  AND s.`key`='church_center'
  AND p.name IN (
    'church.read',
    'calendar.read',
    'song.read'
  )
ON DUPLICATE KEY UPDATE role_id=role_id;

/* =========================================================
   SUPERADMIN INICIAL (GLOBAL, SIN IGLESIA)
   Email: admin@system.master
   Password: Master2026!
   ========================================================= */

-- 1) Crear miembro si no existe
INSERT INTO member (church_id, name, surname, email, phone, status)
SELECT NULL, 'System', 'Master', 'admin@system.master', NULL, 'active'
WHERE NOT EXISTS (
    SELECT 1 FROM member WHERE email = 'admin@system.master'
);

-- 2) Obtener ID del miembro
SET @superadmin_member_id = (
    SELECT id FROM member WHERE email = 'admin@system.master' LIMIT 1
);

-- 3) Crear cuenta si no existe
INSERT INTO user_accounts (member_id, email, password_hash, auth_method, is_active, default_theme, default_language)
SELECT @superadmin_member_id,
       'admin@system.master',
       '$2y$10$8Jz3G5XwCk5K8zXzFvLk7eQmQv0k1gXbG3y8Kp6tR5yNf0cP9aZ8u',
       'password',
       1,
       'dark',
       'es'
WHERE NOT EXISTS (
    SELECT 1 FROM user_accounts WHERE email = 'admin@system.master'
);

-- 4) Obtener ID del rol superadmin
SET @superadmin_role_id = (
    SELECT id FROM roles 
    WHERE name = 'superadmin' AND service_id IS NULL
    LIMIT 1
);

-- 5) Asignar rol global si no existe
INSERT INTO user_global_roles (member_id, role_id)
SELECT @superadmin_member_id, @superadmin_role_id
WHERE NOT EXISTS (
    SELECT 1 FROM user_global_roles 
    WHERE member_id = @superadmin_member_id
      AND role_id = @superadmin_role_id
);

/* =========================================================
   FIN
   ========================================================= */

SET FOREIGN_KEY_CHECKS = 1;