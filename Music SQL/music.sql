-- 1. DROP EXISTING TABLES
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS song_edits;
DROP TABLE IF EXISTS playlist_songs;
DROP TABLE IF EXISTS playlists;
DROP TABLE IF EXISTS song_sections;
DROP TABLE IF EXISTS songs;
SET FOREIGN_KEY_CHECKS = 1;

-- 2. CREATE TABLES
CREATE TABLE songs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NOT NULL DEFAULT 0,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    
    -- Musical Properties (Migrated from Main)
    original_key VARCHAR(10) DEFAULT 'C',
    tempo INT,
    bpm_type VARCHAR(20) DEFAULT 'medium',
    time_signature VARCHAR(10) DEFAULT '4/4',
    
    -- Content
    content TEXT, -- ChordPro format
    lyrics_preview TEXT,
    
    -- Multimedia
    youtube_url VARCHAR(500),
    spotify_url VARCHAR(500),
    
    -- Metadata
    category VARCHAR(50) DEFAULT 'worship',
    tags JSON,
    language VARCHAR(10) DEFAULT 'es',
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_song_title (title),
    INDEX idx_song_artist (artist)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE song_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    song_id INT NOT NULL,
    section_type VARCHAR(50), 
    content TEXT,
    section_order INT DEFAULT 0,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Seed: Default Song (Cantaré de ti)
INSERT INTO songs (id, title, artist, original_key, tempo, bpm_type, time_signature, content, language, category) VALUES
(1, 'Cantaré de ti', 'Joel Pallero', 'C', 106, 'fast', '4/4', '[C]Un día normal[G]\nll[F]eno de tu be[G]ndición\n[C]Un día excepcional[G]\ncomo siem[F]pre me llnaste amo[G]r\n\nCoro:\nY yo can[C]taré de ti[G]\nC[F]antaré de tu amo[G]\nY yo can[C]taré por ti[G]\npor que me h[F]as dado razón[G]\npara vivir[C]', 'es', 'praise');

SET FOREIGN_KEY_CHECKS = 1;

-- 3. CREATE USER AND GRANT PRIVILEGES
CREATE USER IF NOT EXISTS 'ministry'@'%' IDENTIFIED BY 'ministry';

GRANT ALL PRIVILEGES ON database_schema_master.* TO 'ministry'@'%';
GRANT ALL PRIVILEGES ON music_center.* TO 'ministry'@'%';


FLUSH PRIVILEGES;