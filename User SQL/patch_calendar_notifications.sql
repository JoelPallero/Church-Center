/* =========================================================
   PARCHE: CALENDARIO Y NOTIFICACIONES
   Añade tablas para asignaciones, setlists y alertas reales.
   ========================================================= */

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
('Voz (Soprano)', 'Voz'),
('Voz (Contralto)', 'Voz'),
('Voz (Tenor)', 'Voz'),
('Voz (Barítono)', 'Voz'),
('Piano / Teclado', 'Teclas'),
('Guitarra Acústica', 'Cuerdas'),
('Guitarra Eléctrica', 'Cuerdas'),
('Bajo', 'Cuerdas'),
('Batería', 'Percusión'),
('Violín', 'Cuerdas'),
('Saxo', 'Vientos');
