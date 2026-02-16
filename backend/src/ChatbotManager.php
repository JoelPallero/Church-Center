<?php
require_once __DIR__ . '/../config/Database.php';

class ChatbotManager
{
    private $db;

    public function __construct()
    {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function processMessage($churchId, $message)
    {
        $message = mb_strtolower($message, 'UTF-8');

        // 1. Intent Detection (Improved pattern matching)
        if ($this->containsAny($message, ['reunion', 'reunión', 'cronograma', 'horario', 'hora', 'domingo', 'cuando', 'cuándo', 'próxima', 'proxima'])) {
            // Check if they are asking specifically for THE TEAM for the meeting
            if ($this->containsAny($message, ['equipo', 'quién', 'quien', 'toca', 'sirve', 'ministra', 'música', 'musica'])) {
                return $this->handleTeamQuery($churchId, $message);
            }
            return $this->handleScheduleQuery($churchId, $message);
        }

        if ($this->containsAny($message, ['canción', 'cancion', 'música', 'musica', 'letra', 'tonalidad', 'acorde', 'tono', 'está en', 'esta en', 'en d', 'en g', 'en c', 'en f', 'en a', 'en e', 'en b'])) {
            return $this->handleSongQuery($churchId, $message);
        }

        // Default: Search everything
        return $this->handleGeneralSearch($churchId, $message);
    }

    private function containsAny($haystack, $needles)
    {
        foreach ($needles as $needle) {
            if (strpos($haystack, $needle) !== false)
                return true;
        }
        return false;
    }

    private function handleScheduleQuery($churchId, $message)
    {
        $stmt = $this->db->prepare("
            SELECT id, name, date_time, description 
            FROM meeting 
            WHERE church_id = ? AND date_time >= DATE_SUB(NOW(), INTERVAL 2 HOUR) 
            ORDER BY date_time ASC LIMIT 1
        ");
        $stmt->execute([$churchId]);
        $meeting = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($meeting) {
            $timestamp = strtotime($meeting['date_time']);
            $time = date('H:i', $timestamp);
            $date = date('d/m', $timestamp);
            $dayName = $this->getDayName($timestamp);

            $answer = "La próxima reunión es '{$meeting['name']}' este $dayName ($date) a las $time hs. ";

            return [
                "answer" => $answer,
                "actions" => [
                    ["type" => "navigate", "payload" => "/reunions", "label" => "Ver Cronograma Completo"]
                ]
            ];
        }

        return ["answer" => "No he encontrado reuniones próximas en el sistema. ¿Querés que revise el listado general?", "actions" => [["type" => "navigate", "payload" => "/reunions", "label" => "Ir a Reuniones"]]];
    }

    private function getDayName($timestamp)
    {
        $days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return $days[date('w', $timestamp)];
    }

    private function handleSongQuery($churchId, $message)
    {
        // 1. Check for specific tonalities (e.g., "en Dm", "en Sol")
        // Improved Regex to catch "en C", "en Do", "en Re mineor", etc.
        if (preg_match('/en ([a-g][#b]?m?|do|re|mi|fa|sol|la|si)/i', $message, $matches)) {
            $keyInput = strtolower($matches[1]);

            // Map Spanish notes to American notation if necessary
            $map = ['do' => 'C', 're' => 'D', 'mi' => 'E', 'fa' => 'F', 'sol' => 'G', 'la' => 'A', 'si' => 'B'];
            $key = $map[$keyInput] ?? strtoupper($keyInput);

            $stmt = $this->db->prepare("SELECT id, title FROM songs WHERE church_id = ? AND original_key LIKE ? LIMIT 5");
            $stmt->execute([$churchId, "$key%"]);
            $songs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if ($songs) {
                $list = implode(", ", array_map(fn($s) => $s['title'], $songs));
                return [
                    "answer" => "Aquí tenés algunas canciones en $key: $list.",
                    "actions" => [["type" => "navigate", "payload" => "/songs", "label" => "Ver todas"]]
                ];
            }
        }

        // 2. Semantic/Keyword search in title, lyrics and tags
        $searchTerms = ['sacrificio', 'cruz', 'sangre', 'amor', 'gracia', 'jesús', 'jesus', 'espíritu', 'espiritu', 'padre', 'hijo', 'navidad'];
        $foundTerms = [];
        foreach ($searchTerms as $term) {
            if (strpos($message, $term) !== false) {
                $foundTerms[] = $term;
            }
        }

        if (!empty($foundTerms)) {
            $clause = implode(" OR ", array_map(fn($t) => "(title LIKE ? OR lyrics_preview LIKE ? OR tags LIKE ?)", $foundTerms));
            $params = [$churchId];
            foreach ($foundTerms as $t) {
                $params[] = "%$t%";
                $params[] = "%$t%";
                $params[] = "%$t%";
            }

            $stmt = $this->db->prepare("SELECT id, title FROM songs WHERE church_id = ? AND ($clause) LIMIT 3");
            $stmt->execute($params);
            $songs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if ($songs) {
                $list = implode(", ", array_map(fn($s) => $s['title'], $songs));
                return [
                    "answer" => "Encontré estas canciones que hablan sobre " . implode(", ", $foundTerms) . ": $list.",
                    "actions" => [["type" => "navigate", "payload" => "/songs", "label" => "Explorar canciones"]]
                ];
            }
        }

        // 3. Fallback to general title search if it looks like a name
        // (Simple heuristic: if message is short and doesn't match intents)
        return [
            "answer" => "No encontré una coincidencia exacta, pero podés buscar en nuestro catálogo completo.",
            "actions" => [["type" => "navigate", "payload" => "/songs", "label" => "Ver catálogo de canciones"]]
        ];
    }

    private function handleTeamQuery($churchId, $message)
    {
        $stmt = $this->db->prepare("
            SELECT m.name as meeting_name, m.date_time, ma.role_name, mem.name as member_name
            FROM meeting m
            JOIN meeting_assignments ma ON m.id = ma.meeting_id
            JOIN member mem ON ma.member_id = mem.id
            WHERE m.church_id = ? AND m.date_time >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
            ORDER BY m.date_time ASC LIMIT 10
        ");
        $stmt->execute([$churchId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if ($rows) {
            $meetingName = $rows[0]['meeting_name'];
            $date = date('d/m', strtotime($rows[0]['date_time']));
            $answer = "Para la reunión '$meetingName' ($date), el equipo es:\n";
            foreach ($rows as $row) {
                $answer .= "• {$row['role_name']}: **{$row['member_name']}**\n";
            }
            return [
                "answer" => $answer,
                "actions" => [["type" => "navigate", "payload" => "/reunions", "label" => "Ver cronograma"]]
            ];
        }

        return [
            "answer" => "Aún no tengo el equipo confirmado para la próxima reunión. Podés fijarte si ya publicaron el cronograma.",
            "actions" => [["type" => "navigate", "payload" => "/reunions", "label" => "Ir a Cronograma"]]
        ];
    }

    private function handleGeneralSearch($churchId, $message)
    {
        return [
            "answer" => "No estoy seguro de entenderte completamente. Puedo ayudarte a buscar canciones, revisar el cronograma o ver quién toca este domingo.",
            "actions" => [
                ["type" => "navigate", "payload" => "/", "label" => "Ir al Inicio"]
            ]
        ];
    }
}
