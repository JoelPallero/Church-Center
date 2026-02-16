-- ============================================================
-- MAIN DB: ADJUSTMENTS FOR MUSIC DECOUPLING
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Modify the songs table in the Main DB
-- We keep titles and basic info for fast listing, but remove heavy content
-- and musical traits that are now in MusicCenter.
ALTER TABLE songs 
DROP COLUMN content,
DROP COLUMN lyrics_preview,
DROP COLUMN youtube_url,
DROP COLUMN spotify_url,
DROP COLUMN original_key,
DROP COLUMN tempo,
DROP COLUMN bpm_type,
DROP COLUMN time_signature;

-- Add master_song_id to link with MusicCenter
ALTER TABLE songs 
ADD COLUMN master_song_id INT NULL AFTER id;

-- Update the existing seed song reference
UPDATE songs SET master_song_id = 1 WHERE id = 1;

SET FOREIGN_KEY_CHECKS = 1;
