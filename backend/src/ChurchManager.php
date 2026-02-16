<?php
/**
 * ChurchManager.php - Gestión de Iglesias (Master Level)
 */

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/Debug.php';

class ChurchManager
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Listar todas las iglesias
     */
    public function getAll()
    {
        $stmt = $this->db->query("SELECT * FROM church ORDER BY name ASC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Crear una nueva iglesia
     */
    public function create($name, $slug, $address = '', $timezone = 'America/Argentina/Buenos_Aires')
    {
        try {
            $sql = "INSERT INTO church (name, slug, address, timezone) VALUES (:name, :slug, :address, :timezone)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':name' => $name,
                ':slug' => $slug,
                ':address' => $address,
                ':timezone' => $timezone
            ]);

            $churchId = $this->db->lastInsertId();
            Debug::log("Nueva iglesia creada: $name (ID: $churchId)");

            return ['success' => true, 'id' => $churchId];
        } catch (PDOException $e) {
            Debug::error("Error creando iglesia: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Obtener una iglesia por ID
     */
    public function getById($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM church WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>