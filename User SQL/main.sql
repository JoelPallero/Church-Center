/* =========================================================
   MSM2 - ESQUEMA FINAL LIMPIO (FROM SCRATCH)
   Compatible con MySQL 8+
   ========================================================= */

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS invitation_templates;
DROP TABLE IF EXISTS meeting_attendance;
DROP TABLE IF EXISTS meeting_visitors;
DROP TABLE IF EXISTS meeting_setlists;
DROP TABLE IF EXISTS meeting_assignments;
DROP TABLE IF EXISTS visitor_follow_up;
DROP TABLE IF EXISTS visitors;
DROP TABLE IF EXISTS meetings;
DROP TABLE IF EXISTS meeting_categories;
DROP TABLE IF EXISTS calendars;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS areas;
DROP TABLE IF EXISTS member_instruments;
DROP TABLE IF EXISTS instruments;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_service_roles;
DROP TABLE IF EXISTS user_global_roles;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS user_accounts;
DROP TABLE IF EXISTS member;
DROP TABLE IF EXISTS church_services;
DROP TABLE IF EXISTS church;

/* =========================================================
   1) IGLESIAS
   ========================================================= */

CREATE TABLE church (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  address TEXT NULL,
  timezone VARCHAR(100) DEFAULT 'America/Argentina/Buenos_Aires',
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
  sex ENUM('M', 'F') NULL,
  can_create_teams TINYINT(1) DEFAULT 0,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(60) NULL,
  status ENUM('active','pending','inactive','deleted') NOT NULL DEFAULT 'active',
  invite_token VARCHAR(100) NULL UNIQUE,
  token_expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_member_church ON member(church_id);

/* =========================================================
   3) CUENTAS (LOGIN)
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
  google_calendar_id VARCHAR(255) NULL,
  google_api_key VARCHAR(255) NULL,
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

CREATE TABLE IF NOT EXISTS church_services (
  church_id INT NOT NULL,
  service_id INT NOT NULL,
  is_enabled TINYINT(1) DEFAULT 1,
  PRIMARY KEY (church_id, service_id),
  FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* =========================================================
   5) ROLES Y PERMISOS
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

CREATE TABLE permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(90) NOT NULL UNIQUE,
  display_name VARCHAR(140) NOT NULL,
  module VARCHAR(60) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_global_roles (
  member_id INT NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (member_id, role_id),
  FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

/* =========================================================
   6) CONSOLIDACIÓN (VISITANTES Y SEGUIMIENTO)
   ========================================================= */

CREATE TABLE IF NOT EXISTS visitors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  church_id INT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NULL,
  whatsapp VARCHAR(40) NULL,
  email VARCHAR(190) NULL,
  first_meeting_id INT NULL,
  prayer_requests TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS visitor_follow_up (
  id INT AUTO_INCREMENT PRIMARY KEY,
  visitor_id INT NOT NULL,
  contact_date DATE NOT NULL,
  contact_method VARCHAR(100) NULL,
  comments TEXT NULL,
  created_by_member_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_member_id) REFERENCES member(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* =========================================================
   7) ESTRUCTURA ORGANIZATIVA (ÁREAS Y EQUIPOS)
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

CREATE TABLE group_members (
  group_id INT NOT NULL,
  member_id INT NOT NULL,
  role_in_group ENUM('leader','coordinator','member') NOT NULL DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, member_id),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* =========================================================
   8) CALENDARIOS Y REUNIONES
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

CREATE TABLE IF NOT EXISTS meeting_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  church_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#3d68df',
  icon VARCHAR(50) DEFAULT 'event',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_church_category (church_id, name),
  FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  calendar_id INT NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NULL,
  meeting_type ENUM('special', 'recurrent') NOT NULL DEFAULT 'special',
  start_at DATETIME NULL,
  end_at DATETIME NULL,
  day_of_week TINYINT NULL,
  start_time TIME NULL,
  end_time TIME NULL,
  location VARCHAR(255) NULL,
  category VARCHAR(100) NULL,
  created_by_member_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_member_id) REFERENCES member(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meeting_attendance (
  meeting_id INT NOT NULL PRIMARY KEY,
  adults INT NOT NULL DEFAULT 0,
  children INT NOT NULL DEFAULT 0,
  new_people INT NOT NULL DEFAULT 0,
  total INT AS (adults + children) STORED,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meeting_visitors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NULL,
  phone VARCHAR(40) NULL,
  email VARCHAR(190) NULL,
  is_first_time TINYINT(1) DEFAULT 1,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
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

/* =========================================================
   9) INSTRUMENTOS
   ========================================================= */

CREATE TABLE instruments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE,
  category VARCHAR(60) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS member_instruments (
  member_id INT NOT NULL,
  instrument_id INT NOT NULL,
  PRIMARY KEY (member_id, instrument_id),
  FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* =========================================================
   10) SISTEMA (NOTIFICACIONES, AUDITORÍA, PLANTILLAS)
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
  FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
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
  FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invitation_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NOT NULL,
    template_index INT NOT NULL,
    is_active TINYINT(1) DEFAULT 0,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_church_template (church_id, template_index),
    FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* =========================================================
   11) SEEDS BASE
   ========================================================= */

INSERT INTO services (`key`, name, description, active) VALUES
  ('mainhub', 'Pastoral Hub', 'Administración base de la iglesia', 1),
  ('worship', 'Ministry Hub',  'Gestión de música y alabanza', 1),
  ('social',  'Social Media Hub', 'Gestión de redes sociales', 1),
  ('sound',   'Sound Hub', 'Gestión de sonido y audio', 1),
  ('multimedia', 'Multimedia Hub', 'Proyección, letras y contenido visual', 1),
  ('ushers',  'Diaconos Hub', 'Servicio de Ujieres y Recepción', 1),
  ('global_songs', 'Biblioteca Global', 'Acceso al repositorio general de canciones', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);

-- Roles
INSERT INTO roles (service_id, name, display_name, description, level, is_system_role)
VALUES (NULL, 'superadmin', 'Super Administrador', 'Control total global', 0, 1)
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

INSERT INTO roles (service_id, name, display_name, description, level, is_system_role)
SELECT s.id, 'pastor', 'Pastor', 'Admin de iglesia', 10, 1 FROM services s WHERE s.`key`='mainhub'
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

INSERT INTO roles (service_id, name, display_name, description, level, is_system_role)
SELECT s.id, 'leader', 'Líder', 'Puede crear equipos', 20, 1 FROM services s WHERE s.`key`='mainhub'
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

INSERT INTO roles (service_id, name, display_name, description, level, is_system_role)
SELECT s.id, 'coordinator', 'Coordinador', 'Coordina equipos', 30, 1 FROM services s WHERE s.`key`='mainhub'
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

INSERT INTO roles (service_id, name, display_name, description, level, is_system_role)
SELECT s.id, 'member', 'Miembro', 'Acceso básico', 40, 1 FROM services s WHERE s.`key`='mainhub'
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- Permisos
INSERT INTO permissions (name, display_name, module, description) VALUES
  ('church.read', 'Ver iglesia', 'church', 'Permite ver información de iglesia'),
  ('church.update', 'Editar iglesia', 'church', 'Permite editar configuración de iglesia'),
  ('area.create', 'Crear áreas', 'area', 'Permite crear áreas'),
  ('area.update', 'Editar áreas', 'area', 'Permite editar áreas'),
  ('team.read', 'Ver equipos', 'team', 'Permite ver equipos'),
  ('team.create', 'Crear equipos', 'team', 'Permite crear equipos'),
  ('team.update', 'Editar equipos', 'team', 'Permite editar equipos'),
  ('team.manage_members', 'Gestionar miembros', 'team', 'Agregar/quitar miembros'),
  ('person.read', 'Ver personas', 'person', 'Permite ver listado de personas'),
  ('calendar.read', 'Ver calendario', 'calendar', 'Ver calendarios'),
  ('meeting.create', 'Crear reuniones', 'calendar', 'Crear reuniones'),
  ('meeting.update', 'Editar reuniones', 'calendar', 'Editar reuniones'),
  ('meeting.delete', 'Eliminar reuniones', 'calendar', 'Eliminar reuniones'),
  ('song.read', 'Ver canciones', 'song', 'Ver canciones'),
  ('song.create', 'Crear canciones', 'song', 'Crear canciones'),
  ('song.update', 'Editar canciones', 'song', 'Editar canciones'),
  ('song.delete', 'Borrar canciones', 'song', 'Borrar canciones'),
  ('song.approve', 'Aprobar cambios', 'song', 'Permite moderar ediciones de canciones'),
  ('users.invite', 'Invitar personas', 'person', 'Permite enviar invitaciones'),
  ('users.approve', 'Aprobar personas', 'person', 'Permite aprobar solicitudes de acceso'),
  ('users.delete', 'Eliminar personas', 'person', 'Permite eliminar perfiles'),
  ('reunions.view', 'Ver estadísticas de reuniones', 'reports', 'Permite ver reportes de asistencia'),
  ('reports.view', 'Ver estadísticas generales', 'reports', 'Permite ver reportes y dashboard')
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- Instrumentos
INSERT IGNORE INTO instruments (name, category) VALUES
('Voz (Soprano)', 'Voz'), ('Voz (Contralto)', 'Voz'), ('Voz (Tenor)', 'Voz'),
('Voz (Barítono)', 'Voz'), ('Piano / Teclado', 'Teclas'), ('Guitarra Acústica', 'Cuerdas'),
('Guitarra Eléctrica', 'Cuerdas'), ('Bajo', 'Cuerdas'), ('Batería', 'Percusión'),
('Violín', 'Cuerdas'), ('Saxo', 'Vientos');

-- Asignación de Permisos por Rol
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='member' AND p.name IN ('team.read', 'calendar.read', 'song.read')
ON DUPLICATE KEY UPDATE role_id=role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='coordinator' AND p.name IN ('team.read', 'calendar.read', 'song.read', 'song.create', 'song.update')
ON DUPLICATE KEY UPDATE role_id=role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='leader' AND p.name IN ('team.read', 'team.create', 'team.update', 'team.manage_members', 'calendar.read', 'meeting.create', 'meeting.update', 'song.read', 'song.create', 'song.update', 'song.delete')
ON DUPLICATE KEY UPDATE role_id=role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name='pastor' AND p.name IN ('church.read', 'church.update', 'area.create', 'area.update', 'team.read', 'team.create', 'team.update', 'team.manage_members', 'person.read', 'users.invite', 'users.approve', 'users.delete', 'calendar.read', 'meeting.create', 'meeting.update', 'song.read', 'song.create', 'song.update', 'song.delete', 'song.approve', 'reunions.view', 'reports.view')
ON DUPLICATE KEY UPDATE role_id=role_id;

SET FOREIGN_KEY_CHECKS = 1;
SET FOREIGN_KEY_CHECKS = 1;