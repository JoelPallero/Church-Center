<?php
/**
 * Configuración y Conexión a Base de Datos
 * Sistema de Gestión de Iglesia
 */

class Database
{
    private static $instance = null;
    private $connection = null;
    private $musicConnection = null;
    private $config = [];

    private function __construct()
    {
        $this->loadConfig();
        $this->connectMain();
        $this->connectMusic();
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function loadConfig()
    {
        // Cargar configuración desde archivo .env
        $envFile = __DIR__ . '/database.env';
        if (!file_exists($envFile)) {
            $envFile = dirname(__DIR__, 2) . '/database.env';
        }

        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                    list($key, $value) = explode('=', $line, 2);
                    $this->config[trim($key)] = trim($value);
                }
            }
            if (class_exists('Debug')) {
                Debug::log("Database::loadConfig | Config loaded from: $envFile | DB_HOST: " . ($this->config['DB_HOST'] ?? 'NOT SET'));
            }
        } else {
            if (class_exists('Debug')) {
                Debug::error("Database::loadConfig | .env file NOT FOUND at: " . __DIR__ . '/database.env');
            }
        }
    }

    private function connectMain()
    {
        try {
            $dsn = "mysql:host={$this->config['DB_HOST']};port={$this->config['DB_PORT']};dbname={$this->config['DB_NAME']};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
            $this->connection = new PDO($dsn, $this->config['DB_USER'], $this->config['DB_PASS'], $options);
        } catch (PDOException $e) {
            error_log("Error main DB: " . $e->getMessage());
        }
    }

    private function connectMusic()
    {
        try {
            $host = $this->config['MUSIC_DB_HOST'] ?? $this->config['DB_HOST'];
            $dsn = "mysql:host={$host};port={$this->config['DB_PORT']};dbname={$this->config['MUSIC_DB_NAME']};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
            $this->musicConnection = new PDO($dsn, $this->config['MUSIC_DB_USER'], $this->config['MUSIC_DB_PASS'], $options);
        } catch (PDOException $e) {
            error_log("Error music DB: " . $e->getMessage());
        }
    }

    public function getConnection()
    {
        return $this->connection;
    }

    public function getMusicConnection()
    {
        return $this->musicConnection;
    }

    public function getConfig($key = null)
    {
        if ($key === null) {
            return $this->config;
        }
        return isset($this->config[$key]) ? $this->config[$key] : null;
    }

    public function testConnection()
    {
        $status = ['main' => 'ok', 'music' => 'ok', 'errors' => []];

        try {
            if ($this->connection) {
                $this->connection->query("SELECT 1");
            } else {
                $status['main'] = 'disconnected';
                $status['errors'][] = "Main connection is null";
            }
        } catch (PDOException $e) {
            $status['main'] = 'error';
            $status['errors'][] = "Main DB Error: " . $e->getMessage();
        }

        try {
            if ($this->musicConnection) {
                $this->musicConnection->query("SELECT 1");
            } else {
                $status['music'] = 'disconnected';
                $status['errors'][] = "Music connection is null";
            }
        } catch (PDOException $e) {
            $status['music'] = 'error';
            $status['errors'][] = "Music DB Error: " . $e->getMessage();
        }

        return $status;
    }

    public function getDatabaseInfo()
    {
        try {
            $stmt = $this->connection->query("SELECT DATABASE() as db_name, VERSION() as version");
            return $stmt->fetch();
        } catch (PDOException $e) {
            return null;
        }
    }
}

/**
 * Clase para operaciones CRUD básicas
 */
class DatabaseOperations
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Ejecutar consulta preparada
     */
    public function query($sql, $params = [])
    {
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Error en consulta SQL: " . $e->getMessage());
            throw new Exception("Error en la consulta: " . $e->getMessage());
        }
    }

    /**
     * Obtener un registro
     */
    public function fetchOne($sql, $params = [])
    {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }

    /**
     * Obtener múltiples registros
     */
    public function fetchAll($sql, $params = [])
    {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * Insertar registro
     */
    public function insert($table, $data)
    {
        $columns = implode(',', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));

        $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
        $this->query($sql, $data);

        return $this->db->lastInsertId();
    }

    /**
     * Actualizar registro
     */
    public function update($table, $data, $where, $whereParams = [])
    {
        $setParts = [];
        foreach (array_keys($data) as $key) {
            $setParts[] = "{$key} = :{$key}";
        }
        $setClause = implode(', ', $setParts);

        $sql = "UPDATE {$table} SET {$setClause} WHERE {$where}";
        $params = array_merge($data, $whereParams);

        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }

    /**
     * Eliminar registro
     */
    public function delete($table, $where, $params = [])
    {
        $sql = "DELETE FROM {$table} WHERE {$where}";
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }

    /**
     * Contar registros
     */
    public function count($table, $where = '', $params = [])
    {
        $sql = "SELECT COUNT(*) as total FROM {$table}";
        if ($where) {
            $sql .= " WHERE {$where}";
        }

        $result = $this->fetchOne($sql, $params);
        return $result['total'];
    }

    /**
     * Verificar si existe un registro
     */
    public function exists($table, $where, $params = [])
    {
        return $this->count($table, $where, $params) > 0;
    }

    /**
     * Iniciar transacción
     */
    public function beginTransaction()
    {
        return $this->db->beginTransaction();
    }

    /**
     * Confirmar transacción
     */
    public function commit()
    {
        return $this->db->commit();
    }

    /**
     * Revertir transacción
     */
    public function rollback()
    {
        return $this->db->rollback();
    }
}

/**
 * Función helper para obtener instancia de base de datos
 */
function getDB()
{
    return Database::getInstance();
}

/**
 * Función helper para operaciones de base de datos
 */
function getDBOperations()
{
    return new DatabaseOperations();
}

// Verificar conexión al cargar
try {
    $db = getDB();
    $test = $db->testConnection();
    if ($test['main'] !== 'ok' || $test['music'] !== 'ok') {
        error_log("Database initialization warnings: " . implode(" | ", $test['errors']));
    }
} catch (Exception $e) {
    error_log("Error de inicialización de base de datos: " . $e->getMessage());
}
?>