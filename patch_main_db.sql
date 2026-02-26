/* =========================================================
   PARCHE MAESTRO ACTUALIZADO: BASE DE DATOS PRINCIPAL (MAIN)
   =========================================================
   ESTE SCRIPT ES MÁY ROBUSTO PARA EVITAR EL ERROR #1072.
   Si las tablas ya existen pero están mal formadas, 
   estos cambios aseguran que se creen correctamente.
   ========================================================= */

-- 1. Notificaciones
DROP TABLE IF EXISTS notifications;
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

-- 2. Asignaciones de Reuniones
DROP TABLE IF EXISTS meeting_assignments;
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

-- 3. Setlists de Reuniones
DROP TABLE IF EXISTS meeting_setlists;
CREATE TABLE meeting_setlists (
  meeting_id INT NOT NULL,
  playlist_id INT NOT NULL,
  assigned_by_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (meeting_id, playlist_id),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by_id) REFERENCES member(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Instrumentos (Si ya existe, la mantiene)
CREATE TABLE IF NOT EXISTS instruments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE,
  category VARCHAR(60) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO instruments (name, category) VALUES
('Voz (Soprano)', 'Voz'), ('Voz (Contralto)', 'Voz'), ('Voz (Tenor)', 'Voz'),
('Voz (Barítono)', 'Voz'), ('Piano / Teclado', 'Teclas'), ('Guitarra Acústica', 'Cuerdas'),
('Guitarra Eléctrica', 'Cuerdas'), ('Bajo', 'Cuerdas'), ('Batería', 'Percusión'),
('Violín', 'Cuerdas'), ('Saxo', 'Vientos');

-- 5. Registro de Actividad
DROP TABLE IF EXISTS activity_log;
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
