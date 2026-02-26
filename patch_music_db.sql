/* =========================================================
   PARCHE MAESTRO ACTUALIZADO: BASE DE DATOS DE MÚSICA (MUSIC)
   ========================================================= */

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Playlists
DROP TABLE IF EXISTS playlist_songs;
DROP TABLE IF EXISTS playlists;

CREATE TABLE playlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  church_id INT NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  created_by INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX (church_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE playlist_songs (
  playlist_id INT NOT NULL,
  song_id INT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  PRIMARY KEY (playlist_id, song_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Moderación de Ediciones
DROP TABLE IF EXISTS song_edits;
CREATE TABLE song_edits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  song_id INT NOT NULL,
  member_id INT NOT NULL,
  proposed_data JSON NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX (status),
  INDEX (song_id),
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
