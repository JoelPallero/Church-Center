DROP DATABASE IF EXISTS `music_center`;
CREATE DATABASE `music_center`;
USE `music_center`;

-- 1. DROP EXISTING TABLES
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS song_sections;
DROP TABLE IF EXISTS songs;
SET FOREIGN_KEY_CHECKS = 1;

-- 2. CREATE TABLES
CREATE TABLE songs (
    id INT AUTO_INCREMENT PRIMARY KEY,
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

-- Seed: Default Song (Cantaré de ti)
INSERT INTO songs (id, title, artist, original_key, tempo, bpm_type, time_signature, content, language, category) VALUES
(1, 'Cantaré de ti', 'Joel Pallero', 'C', 106, 'fast', '4/4', '[C]Un día normal[G]\nll[F]eno de tu be[G]ndición\n[C]Un día excepcional[G]\ncomo siem[F]pre me llnaste amo[G]r\n\nCoro:\nY yo can[C]taré de ti[G]\nC[F]antaré de tu amo[G]\nY yo can[C]taré por ti[G]\npor que me h[F]as dado razón[G]\npara vivir[C]', 'es', 'praise');

SET FOREIGN_KEY_CHECKS = 1;

-- 3. CREATE USER AND GRANT PRIVILEGES
CREATE USER IF NOT EXISTS 'ministry'@'%' IDENTIFIED BY 'ministry';

GRANT ALL PRIVILEGES ON database_schema_master.* TO 'ministry'@'%';
GRANT ALL PRIVILEGES ON music_center.* TO 'ministry'@'%';


FLUSH PRIVILEGES;
