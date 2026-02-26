/* =========================================================
   MASTER PATCH: DE-MOCKING AUDIT COMPLETE
   Este archivo consolida todas las modificaciones realizadas
   en las bases de datos Main y Music para habilitar la 
   funcionalidad real de la aplicación.
   ========================================================= */

-- ---------------------------------------------------------
-- SECCIÓN 1: BASE DE DATOS PRINCIPAL (MAIN)
-- ---------------------------------------------------------

-- 1. Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  type VARCHAR(50) NOT NULL, -- e.g. 'invite', 'assignment', 'system'
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255) NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_notifications_member ON notifications(member_id);
CREATE INDEX idx_notifications_unread ON notifications(member_id, is_read);

-- 2. Tabla de Asignaciones de Miembros a Reuniones
CREATE TABLE IF NOT EXISTS meeting_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  member_id INT NOT NULL,
  role VARCHAR(60) NULL, -- e.g. 'Cantante', 'Sonido'
  instrument_id INT NULL,
  status ENUM('pending', 'confirmed', 'declined') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  UNIQUE KEY uq_meeting_member (meeting_id, member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabla de Vinculación de Setlists (Playlists) a Reuniones
CREATE TABLE IF NOT EXISTS meeting_setlists (
  meeting_id INT NOT NULL,
  playlist_id INT NOT NULL,
  assigned_by_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (meeting_id, playlist_id),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by_id) REFERENCES member(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabla de Instrumentos (Cátalogo)
CREATE TABLE IF NOT EXISTS instruments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE,
  category VARCHAR(60) NULL -- e.g. 'Vientos', 'Cuerdas'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO instruments (name, category) VALUES
('Voz (Soprano)', 'Voz'), ('Voz (Contralto)', 'Voz'), ('Voz (Tenor)', 'Voz'),
('Voz (Barítono)', 'Voz'), ('Piano / Teclado', 'Teclas'), ('Guitarra Acústica', 'Cuerdas'),
('Guitarra Eléctrica', 'Cuerdas'), ('Bajo', 'Cuerdas'), ('Batería', 'Percusión'),
('Violín', 'Cuerdas'), ('Saxo', 'Vientos');

-- 5. Tabla de Registro de Actividad (Audit Log)
CREATE TABLE IF NOT EXISTS activity_log (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_activity_church ON activity_log(church_id);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);


-- ---------------------------------------------------------
-- SECCIÓN 2: BASE DE DATOS DE MÚSICA (MUSIC)
-- ---------------------------------------------------------

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tablas para Playlists (Listas de Alabanza)
CREATE TABLE IF NOT EXISTS playlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  church_id INT NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  created_by INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS playlist_songs (
  playlist_id INT NOT NULL,
  song_id INT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  PRIMARY KEY (playlist_id, song_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de Moderación de Ediciones de Canciones
CREATE TABLE IF NOT EXISTS song_edits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  song_id INT NOT NULL,
  member_id INT NOT NULL,
  proposed_data JSON NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- FÍN DEL PARCHE
