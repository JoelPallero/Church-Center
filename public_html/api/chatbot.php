<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Cargar config desde backend (incluye GEMINI_API_KEY, misma fuente que el resto de la app)
$configPath = __DIR__ . '/../../backend/config/database.env';
if (file_exists($configPath)) {
    $env = parse_ini_file($configPath);
    if ($env) {
        foreach ($env as $k => $v) {
            $_ENV[$k] = $v;
        }
    }
}

// Verificar autenticación (ajustá según tu sistema de sesiones/JWT)
session_start();
if (!isset($_SESSION['user_id'])) {
    // Si usás JWT, verificá el token del header Authorization
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    if (empty($authHeader) || !validateToken($authHeader)) {
        http_response_code(401);
        echo json_encode(['error' => 'No autorizado']);
        exit();
    }
}

function validateToken($authHeader) {
    // Implementá tu lógica de validación JWT aquí
    // Por ahora retorna true si hay token (ajustar según tu sistema)
    return str_starts_with($authHeader, 'Bearer ') && strlen($authHeader) > 10;
}

// Conexión a la base de datos
function getDB() {
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $dbname = $_ENV['DB_NAME'] ?? '';
    $user = $_ENV['DB_USER'] ?? '';
    $pass = $_ENV['DB_PASS'] ?? '';
    
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        return null;
    }
}

// Obtener datos relevantes de la BD según la consulta
function getRelevantData($query, $pdo) {
    if (!$pdo) return [];
    
    $data = [];
    $queryLower = strtolower($query);
    
    // Detectar qué tablas consultar según palabras clave
    $needsSongs = preg_match('/\b(canci[oó]n|canciones|song|letra|letras|coro|estribillo|m[úu]sica)\b/u', $queryLower);
    $needsPlaylists = preg_match('/\b(listado|lista|playlist|repertorio|setlist)\b/u', $queryLower);
    $needsMeetings = preg_match('/\b(reuni[oó]n|reuniones|meeting|encuentro|sesi[oó]n)\b/u', $queryLower);
    $needsTeams = preg_match('/\b(equipo|equipos|team|grupo|grupos)\b/u', $queryLower);
    $needsAreas = preg_match('/\b([áa]rea|[áa]reas|departamento|sector)\b/u', $queryLower);
    $needsTasks = preg_match('/\b(tarea|tareas|task|pendiente|actividad)\b/u', $queryLower);
    
    // Si no se detecta contexto específico, obtener resumen general
    $isGeneral = !$needsSongs && !$needsPlaylists && !$needsMeetings && !$needsTeams && !$needsAreas && !$needsTasks;

    try {
        if ($needsSongs || $isGeneral) {
            // AJUSTÁ los nombres de tabla/columnas a tu esquema real
            $stmt = $pdo->query("SELECT id, titulo, artista, letra, tono, categoria FROM canciones ORDER BY titulo LIMIT 50");
            $data['canciones'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        if ($needsPlaylists || $isGeneral) {
            $stmt = $pdo->query("SELECT lc.id, lc.nombre, lc.descripcion, lc.fecha, COUNT(lcr.cancion_id) as total_canciones 
                                 FROM listados_canciones lc 
                                 LEFT JOIN listados_canciones_rel lcr ON lc.id = lcr.listado_id 
                                 GROUP BY lc.id ORDER BY lc.fecha DESC LIMIT 20");
            $data['listados'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        if ($needsMeetings || $isGeneral) {
            $stmt = $pdo->query("SELECT id, titulo, fecha, descripcion, tipo, estado FROM reuniones ORDER BY fecha DESC LIMIT 20");
            $data['reuniones'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        if ($needsTeams || $isGeneral) {
            $stmt = $pdo->query("SELECT id, nombre, descripcion FROM equipos ORDER BY nombre LIMIT 20");
            $data['equipos'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        if ($needsAreas || $isGeneral) {
            $stmt = $pdo->query("SELECT id, nombre, descripcion FROM areas ORDER BY nombre LIMIT 20");
            $data['areas'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        if ($needsTasks || $isGeneral) {
            $stmt = $pdo->query("SELECT id, titulo, descripcion, estado, prioridad, fecha_limite FROM tareas ORDER BY fecha_limite ASC LIMIT 30");
            $data['tareas'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
    } catch (PDOException $e) {
        // Log error, no exponer detalles al cliente
        error_log('DB Error en chatbot: ' . $e->getMessage());
    }
    
    return $data;
}

// Construir el prompt del sistema
function buildSystemPrompt($dbData) {
    $dataJson = json_encode($dbData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
    return "Eres un asistente interno del sistema de gestión de la organización. Tu única función es responder preguntas sobre los datos de la base de datos que se te proporcionan a continuación.

REGLAS ESTRICTAS:
1. SOLO responde sobre los datos proporcionados en el contexto de la base de datos.
2. NO respondas preguntas de matemáticas, ciencias, historia, geografía u otros temas externos.
3. NO actúes como ChatGPT genérico. Si te preguntan algo que no está en los datos, di claramente: 'Solo puedo responder sobre los datos del sistema (canciones, listados, reuniones, equipos, áreas y tareas).'
4. Si no encontrás la información en los datos, decilo honestamente.
5. Respondé siempre en español, de forma clara y concisa.
6. Podés hacer reportes, buscar, listar y resumir datos de las categorías disponibles.
7. Para reportes, presentá la información de forma organizada y legible.

DATOS ACTUALES DE LA BASE DE DATOS:
$dataJson

Respondé siempre basándote únicamente en estos datos. Si el usuario pide algo fuera del alcance del sistema, recordale amablemente cuáles son tus capacidades.";
}

// Llamar a la API de Gemini
function callGemini($userMessage, $conversationHistory, $systemPrompt) {
    $apiKey = $_ENV['GEMINI_API_KEY'] ?? '';
    
    if (empty($apiKey)) {
        return ['error' => 'API key de Gemini no configurada'];
    }
    
    // Construir historial de conversación para Gemini
    $contents = [];
    
    // Agregar historial previo
    foreach ($conversationHistory as $msg) {
        $contents[] = [
            'role' => $msg['role'] === 'assistant' ? 'model' : 'user',
            'parts' => [['text' => $msg['content']]]
        ];
    }
    
    // Agregar mensaje actual
    $contents[] = [
        'role' => 'user',
        'parts' => [['text' => $userMessage]]
    ];
    
    $payload = [
        'system_instruction' => [
            'parts' => [['text' => $systemPrompt]]
        ],
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
    
    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$apiKey";
    
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
    curl_close($ch);
    
    if ($httpCode !== 200) {
        error_log("Gemini API error $httpCode: $response");
        return ['error' => 'Error al conectar con el servicio de IA'];
    }
    
    $data = json_decode($response, true);
    
    $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'No se pudo obtener respuesta.';
    
    return ['message' => $text];
}

// Main
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit();
}

$body = json_decode(file_get_contents('php://input'), true);
$userMessage = trim($body['message'] ?? '');
$conversationHistory = $body['history'] ?? [];

if (empty($userMessage)) {
    http_response_code(400);
    echo json_encode(['error' => 'Mensaje vacío']);
    exit();
}

// Limitar historial a últimos 10 mensajes para no exceder tokens
$conversationHistory = array_slice($conversationHistory, -10);

$pdo = getDB();
$dbData = getRelevantData($userMessage, $pdo);
$systemPrompt = buildSystemPrompt($dbData);
$result = callGemini($userMessage, $conversationHistory, $systemPrompt);

echo json_encode($result);
