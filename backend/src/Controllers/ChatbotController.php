<?php

namespace App\Controllers;

use App\Helpers\Response;
use App\Database;
use PDO;

class ChatbotController
{
    public function handle($memberId)
    {
        $method = $_SERVER['REQUEST_METHOD'];
        if ($method !== 'POST') {
            Response::error('Método no permitido', 405);
            return;
        }

        $raw = file_get_contents('php://input');
        $body = json_decode($raw, true) ?? [];
        $userMessage = trim($body['message'] ?? '');
        $history = $body['history'] ?? [];

        if (empty($userMessage)) {
            Response::error('Mensaje vacío', 400);
            return;
        }

        $history = array_slice($history, -10);

        try {
            $dbData = $this->getRelevantData($userMessage, $memberId);
            $systemPrompt = $this->buildSystemPrompt($dbData);
            $result = $this->callGemini($userMessage, $history, $systemPrompt);

            if (isset($result['error'])) {
                Response::error($result['error'], 500);
                return;
            }

            Response::json(['message' => $result['message']]);
        } catch (\Throwable $e) {
            \App\Helpers\Logger::error('ChatbotController Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            Response::error('Error al procesar la consulta: ' . $e->getMessage(), 500);
        }
    }

    private function getRelevantData(string $query, $memberId): array
    {
        $data = [];
        $queryLower = strtolower($query);

        $needsSongs = preg_match('/\b(canci[oó]n|canciones|song|letra|letras|coro|estribillo|m[úu]sica|biblioteca)\b/u', $queryLower);
        $needsPlaylists = preg_match('/\b(listado|lista|playlist|repertorio|setlist)\b/u', $queryLower);
        $needsMeetings = preg_match('/\b(reuni[oó]n|reuniones|meeting|encuentro|sesi[oó]n|calendario)\b/u', $queryLower);
        $needsTeams = preg_match('/\b(equipo|equipos|team|grupo|grupos)\b/u', $queryLower);
        $needsAreas = preg_match('/\b([áa]rea|[áa]reas|departamento|sector)\b/u', $queryLower);
        $needsPeople = preg_match('/\b(persona|personas|miembro|miembros|people)\b/u', $queryLower);
        $isGeneral = !$needsSongs && !$needsPlaylists && !$needsMeetings && !$needsTeams && !$needsAreas && !$needsPeople;

        try {
            if ($needsSongs || $isGeneral) {
                $db = Database::getInstance('music');
                $stmt = $db->query("SELECT id, church_id, title, artist, category, original_key FROM songs WHERE is_active = 1 ORDER BY title LIMIT 50");
                $data['canciones'] = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
            }

            $mainDb = Database::getInstance();
            $churchId = $this->getUserChurchId($memberId, $mainDb);

            if ($needsPlaylists || $isGeneral) {
                try {
                    $musicDb = Database::getInstance('music');
                    $stmt = $musicDb->prepare("SELECT id, name, description, church_id FROM playlists WHERE is_active = 1 AND (church_id = ? OR church_id = 0) ORDER BY name LIMIT 20");
                    $stmt->execute([$churchId ?: 0]);
                    $data['listados'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } catch (\Exception $e) {
                    $data['listados'] = [];
                }
            }

            if ($needsMeetings || $isGeneral) {
                try {
                    $sql = "SELECT m.id, m.title, m.start_at, m.end_at, m.location, m.meeting_type
                            FROM meetings m
                            JOIN calendars c ON m.calendar_id = c.id
                            WHERE c.church_id = ? ORDER BY m.start_at DESC LIMIT 20";
                    $stmt = $mainDb->prepare($sql);
                    $stmt->execute([$churchId ?: 1]);
                    $data['reuniones'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } catch (\Exception $e) {
                    $data['reuniones'] = [];
                }
            }

            if ($needsTeams || $isGeneral) {
                try {
                    $stmt = $mainDb->prepare("SELECT id, name, description FROM groups WHERE church_id = ? ORDER BY name LIMIT 20");
                    $stmt->execute([$churchId ?: 1]);
                    $data['equipos'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } catch (\Exception $e) {
                    $data['equipos'] = [];
                }
            }

            if ($needsAreas || $isGeneral) {
                try {
                    $stmt = $mainDb->prepare("SELECT id, name, description FROM areas WHERE church_id = ? ORDER BY name LIMIT 20");
                    $stmt->execute([$churchId ?: 1]);
                    $data['areas'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } catch (\Exception $e) {
                    $data['areas'] = [];
                }
            }

            if ($needsPeople || $isGeneral) {
                try {
                    $stmt = $mainDb->prepare("SELECT id, name, surname, email FROM member WHERE church_id = ? AND status = 'active' ORDER BY name LIMIT 30");
                    $stmt->execute([$churchId ?: 1]);
                    $data['personas'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } catch (\Exception $e) {
                    $data['personas'] = [];
                }
            }
        } catch (\Exception $e) {
            \App\Helpers\Logger::error('Chatbot getRelevantData: ' . $e->getMessage());
        }

        return $data;
    }

    private function getUserChurchId($memberId, $db): ?int
    {
        $stmt = $db->prepare("SELECT church_id FROM member WHERE id = ?");
        $stmt->execute([$memberId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? ($row['church_id'] ? (int)$row['church_id'] : null) : null;
    }

    private function buildSystemPrompt(array $dbData): string
    {
        $dataJson = json_encode($dbData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        return "Eres un asistente interno del sistema de gestión MSM2. Tu única función es responder preguntas sobre los datos proporcionados.

REGLAS:
1. SOLO responde sobre los datos proporcionados (canciones, listados, reuniones, equipos, áreas, personas).
2. NO respondas temas externos. Si no está en los datos, di: 'Solo puedo responder sobre los datos del sistema.'
3. Responde siempre en español, claro y conciso.
4. Presenta reportes de forma organizada.

DATOS DEL SISTEMA:
$dataJson

Responde basándote únicamente en estos datos.";
    }

    private function callGemini(string $userMessage, array $history, string $systemPrompt): array
    {
        $configPath = \APP_ROOT . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'database.env';
        if (!file_exists($configPath)) {
            return ['error' => 'Configuración no encontrada'];
        }
        $env = parse_ini_file($configPath);
        $apiKey = $env['GEMINI_API_KEY'] ?? '';

        if (empty($apiKey)) {
            return ['error' => 'API key de Gemini no configurada'];
        }

        $contents = [];
        foreach ($history as $msg) {
            $contents[] = [
                'role' => ($msg['role'] ?? '') === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $msg['content'] ?? '']]
            ];
        }
        $contents[] = ['role' => 'user', 'parts' => [['text' => $userMessage]]];

        $payload = [
            'system_instruction' => ['parts' => [['text' => $systemPrompt]]],
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.3,
                'maxOutputTokens' => 1024,
                'topP' => 0.8,
            ],
            'safetySettings' => [
                ['category' => 'HARM_CATEGORY_HARASSMENT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
                ['category' => 'HARM_CATEGORY_HATE_SPEECH', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
            ]
        ];

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=' . $apiKey;

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT => 30,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($httpCode !== 200) {
            \App\Helpers\Logger::error("Gemini API error $httpCode", [
                'response' => $response,
                'curl_error' => $curlError,
                'url' => $url
            ]);
            return ['error' => 'Error al conectar con el servicio de IA (' . $httpCode . '): ' . $curlError];
        }

        $data = json_decode($response, true);
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'No se pudo obtener respuesta.';

        return ['message' => $text];
    }
}
