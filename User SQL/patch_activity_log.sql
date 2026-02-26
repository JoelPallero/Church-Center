/* =========================================================
   PARCHE: ACTIVITY LOG (REGISTRO DE ACTIVIDAD)
   Añade tabla para el feed de actividades del dashboard.
   ========================================================= */

CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  church_id INT NOT NULL,
  member_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,     -- e.g. 'created', 'updated', 'approved', 'invited'
  entity_type VARCHAR(50) NOT NULL, -- e.g. 'area', 'team', 'member', 'meeting', 'playlist'
  entity_id INT NULL,
  details JSON NULL,                -- Datos adicionales como nombres, fechas, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (church_id) REFERENCES church(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_activity_church ON activity_log(church_id);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);
