/* =========================================================
   PARCHE: PLAYLISTS (LISTAS DE ALABANZA)
   Añade tablas para gestionar setlists en el Music DB.
   ========================================================= */

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabla de Playlists
CREATE TABLE IF NOT EXISTS playlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  church_id INT NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  created_by INT NULL, -- member_id del creador
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_playlist_church ON playlists(church_id);

-- 2. Tabla de canciones en Playlists (muchos a muchos con orden)
CREATE TABLE IF NOT EXISTS playlist_songs (
  playlist_id INT NOT NULL,
  song_id INT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  PRIMARY KEY (playlist_id, song_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
