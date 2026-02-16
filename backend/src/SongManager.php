<?php
/**
 * SongManager Class (Refactored)
 * Handles Songs in ChordPro format for the unified schema.
 */

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/MusicTheory.php';

class SongManager
{
    private $db;      // Main DB (ministryhub)
    private $musicDb; // Music DB (u593735198_musiccenter)
    private $activity;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
        $this->musicDb = Database::getInstance()->getMusicConnection();
        require_once __DIR__ . '/ActivityManager.php';
        $this->activity = new ActivityManager();
    }

    /**
     * Get list of songs with basic info (Orchestrated Search)
     */
    public function searchSongs($churchId, $query = '', $isMaster = false)
    {
        // 1. Get ALL IDs owned by this church from Main DB (Our "Reference" Table)
        $sqlMain = "SELECT master_song_id, id as local_id FROM songs 
                    WHERE (:is_master = 1 OR church_id = :cid OR church_id IS NULL)";
        $stmtMain = $this->db->prepare($sqlMain);
        $stmtMain->execute([
            ':cid' => $churchId,
            ':is_master' => $isMaster ? 1 : 0
        ]);
        $mappings = $stmtMain->fetchAll(PDO::FETCH_KEY_PAIR); // [master_id => local_id]

        $masterIds = array_keys($mappings);
        if (empty($masterIds))
            return [];

        // 2. Fetch full descriptive metadata from MusicCenter using those IDs
        $idPlaceholders = implode(',', array_fill(0, count($masterIds), '?'));
        $sqlMusic = "SELECT id as master_song_id, title, artist, category, tags 
                     FROM songs 
                     WHERE id IN ($idPlaceholders)";

        $params = $masterIds;
        if (!empty($query)) {
            $sqlMusic .= " AND (title LIKE ? OR artist LIKE ?)";
            $params[] = "%$query%";
            $params[] = "%$query%";
        }

        $sqlMusic .= " ORDER BY title ASC";

        $stmtMusic = $this->musicDb->prepare($sqlMusic);
        $stmtMusic->execute($params);
        $results = $stmtMusic->fetchAll(PDO::FETCH_ASSOC);

        // 3. Map back the Local ID and fetch Member Keys
        $localIds = array_values($mappings);
        $memberKeys = [];
        if (!empty($localIds)) {
            $placeholders = implode(',', array_fill(0, count($localIds), '?'));
            $sqlKeys = "SELECT smk.song_id, smk.preferred_key, m.name as member_name, m.id as member_id
                        FROM song_member_keys smk
                        JOIN member m ON smk.member_id = m.id
                        WHERE smk.song_id IN ($placeholders)";
            $stmtKeys = $this->db->prepare($sqlKeys);
            $stmtKeys->execute($localIds);
            $keysData = $stmtKeys->fetchAll(PDO::FETCH_ASSOC);

            foreach ($keysData as $kd) {
                $memberKeys[$kd['song_id']][] = [
                    'memberId' => $kd['member_id'],
                    'memberName' => $kd['member_name'],
                    'preferredKey' => $kd['preferred_key']
                ];
            }
        }

        foreach ($results as &$r) {
            $localId = $mappings[$r['master_song_id']];
            $r['id'] = $localId;
            $r['member_keys'] = $memberKeys[$localId] ?? [];
        }

        return $results;
    }

    /**
     * Get single song (Aggregated from both DBs)
     */
    public function getSong($id, $churchId)
    {
        // 1. Get ownership data from Main DB
        $sql = "SELECT id, master_song_id, church_id, created_by 
                FROM songs WHERE id = :id AND (:cid1 IS NULL OR church_id = :cid2 OR church_id IS NULL)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id, ':cid1' => $churchId, ':cid2' => $churchId]);
        $ownership = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$ownership || !$ownership['master_song_id'])
            return $ownership;

        // 2. Get full content and musical traits from Music DB
        $sqlMusic = "SELECT id as master_song_id, title, artist, original_key, tempo, bpm_type, time_signature, content, lyrics_preview, youtube_url, spotify_url, language, category, tags
                     FROM songs WHERE id = :mid";
        $stmtMusic = $this->musicDb->prepare($sqlMusic);
        $stmtMusic->execute([':mid' => $ownership['master_song_id']]);
        $musicData = $stmtMusic->fetch(PDO::FETCH_ASSOC);

        return array_merge($ownership, $musicData ?: []);
    }

    /**
     * Create song (Writes Content to Music DB and Ownership Log to Main DB)
     */
    public function createSong($data)
    {
        if (!$this->musicDb)
            throw new Exception("MusicCenter database connection failed.");

        $this->db->beginTransaction();
        $this->musicDb->beginTransaction();

        try {
            // A. Write to Music DB (The Centralized Content)
            $sqlMusic = "INSERT INTO songs (title, artist, original_key, tempo, bpm_type, time_signature, content, category, tags, language)
                         VALUES (:title, :artist, :okey, :tempo, :bpm, :sig, :content, :category, :tags, :lang)";
            $stmtMusic = $this->musicDb->prepare($sqlMusic);
            $stmtMusic->execute([
                ':title' => $data['title'],
                ':artist' => $data['artist'] ?? '',
                ':okey' => $data['original_key'] ?? 'C',
                ':tempo' => $data['tempo'] ?? 120,
                ':bpm' => $data['bpm_type'] ?? 'medium',
                ':sig' => $data['time_signature'] ?? '4/4',
                ':content' => $data['content'],
                ':category' => $data['category'] ?? 'worship',
                ':tags' => isset($data['tags']) ? json_encode($data['tags']) : null,
                ':lang' => $data['language'] ?? 'es'
            ]);
            $masterId = $this->musicDb->lastInsertId();

            // B. Write to Main DB (The Ownership Reference)
            $sqlMain = "INSERT INTO songs (master_song_id, church_id, created_by)
                        VALUES (:mid, :cid, :uid)";
            $stmtMain = $this->db->prepare($sqlMain);
            $stmtMain->execute([
                ':mid' => $masterId,
                ':cid' => $data['church_id'],
                ':uid' => $data['created_by']
            ]);
            $newId = $this->db->lastInsertId();

            $this->db->commit();
            $this->musicDb->commit();

            Debug::log("SONG_CREATE_SUCCESS | LocalID: $newId | MasterID: $masterId");
            $this->activity->log($data['church_id'], $data['created_by'], 'song.create', 'songs', $newId, null, ['title' => $data['title']]);

            // Notify all members of this church
            require_once __DIR__ . '/NotificationManager.php';
            $notif = new NotificationManager();
            $stmtMembers = $this->db->prepare("SELECT id FROM member WHERE church_id = :cid AND status_id = 1");
            $stmtMembers->execute([':cid' => $data['church_id']]);
            $members = $stmtMembers->fetchAll(PDO::FETCH_COLUMN);

            foreach ($members as $mid) {
                if ($mid == $data['created_by'])
                    continue; // Don't notify creator
                $notif->create($mid, 'new_song', "Nueva canción añadida: " . $data['title'], "/songs?id=$newId");
            }

            return $newId;
        } catch (Exception $e) {
            $this->db->rollBack();
            $this->musicDb->rollBack();
            Debug::error("SONG_CREATE_FAILED: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update song (Updates MusicCenter content)
     */
    public function updateSong($id, $churchId, $data)
    {
        $song = $this->getSong($id, $churchId);
        if (!$song || !$song['master_song_id'])
            return false;

        $this->musicDb->beginTransaction();
        try {
            $musicFields = [];
            $musicParams = [':mid' => $song['master_song_id']];
            $map = [
                'title' => 'title',
                'artist' => 'artist',
                'original_key' => 'original_key',
                'tempo' => 'tempo',
                'bpm_type' => 'bpm_type',
                'time_signature' => 'time_signature',
                'content' => 'content',
                'language' => 'language',
                'youtube_url' => 'youtube_url',
                'spotify_url' => 'spotify_url',
                'category' => 'category'
            ];

            foreach ($map as $f => $col) {
                if (isset($data[$f])) {
                    $musicFields[] = "$col = :$f";
                    $musicParams[":$f"] = $data[$f];
                }
            }

            if (isset($data['tags'])) {
                $musicFields[] = "tags = :tags";
                $musicParams[':tags'] = json_encode($data['tags']);
            }

            if (!empty($musicFields)) {
                $sqlMusic = "UPDATE songs SET " . implode(', ', $musicFields) . " WHERE id = :mid";
                $this->musicDb->prepare($sqlMusic)->execute($musicParams);
            }

            $this->musicDb->commit();
            return true;
        } catch (Exception $e) {
            $this->musicDb->rollBack();
            return false;
        }
    }

    /**
     * Delete song reference
     */
    public function deleteSong($id, $churchId)
    {
        // We delete the reference in the Main DB.
        $sql = "DELETE FROM songs WHERE id = :id AND (:cid1 IS NULL OR church_id = :cid2 OR church_id IS NULL)";
        $stmt = $this->db->prepare($sql);
        $success = $stmt->execute([':id' => $id, ':cid1' => $churchId, ':cid2' => $churchId]);
        if ($success) {
            $this->activity->log($churchId, null, 'song.delete', 'songs', $id);
        }
        return $success;
    }

    public function upsertMemberKey($songId, $memberId, $preferredKey, $churchId)
    {
        $sql = "INSERT INTO song_member_keys (song_id, member_id, preferred_key) 
                VALUES (:sid, :mid, :key) 
                ON DUPLICATE KEY UPDATE preferred_key = :key2";
        $stmt = $this->db->prepare($sql);
        $success = $stmt->execute([
            ':sid' => $songId,
            ':mid' => $memberId,
            ':key' => $preferredKey,
            ':key2' => $preferredKey
        ]);
        if ($success) {
            $this->activity->log($churchId, null, 'song.key_assign', 'songs', $songId, null, ['member_id' => $memberId, 'key' => $preferredKey]);
        }
        return $success;
    }
}
?>