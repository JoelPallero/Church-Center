/* =========================================================
   PARCHE: SONG EDITS (MODERACIÓN DE CANCIONES)
   Añade tabla para propuestas de edición de canciones.
   ========================================================= */

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS song_edits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  song_id INT NOT NULL,
  member_id INT NOT NULL, -- El miembro que propone el cambio
  proposed_data JSON NOT NULL, -- Objeto JSON con los campos a cambiar (title, lyrics, key, etc.)
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_song_edits_status ON song_edits(status);
CREATE INDEX idx_song_edits_song ON song_edits(song_id);

SET FOREIGN_KEY_CHECKS = 1;
