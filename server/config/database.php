<?php
class Database {
    private static $instance = null;
    private $host = "localhost";
    private $db_name = "school";
    private $username = "root";
    private $password = ""; 
    public $conn;

    public function __construct() {
        // Load production config if it exists
        if (file_exists(__DIR__ . '/db_config.php')) {
            require_once __DIR__ . '/db_config.php';
            $this->host = defined('DB_HOST') ? DB_HOST : $this->host;
            $this->username = defined('DB_USER') ? DB_USER : $this->username;
            $this->password = defined('DB_PASS') ? DB_PASS : $this->password;
            $this->db_name = defined('DB_NAME') ? DB_NAME : $this->db_name;
        }

        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            header('Content-Type: application/json');
            echo json_encode(["status" => "error", "message" => "Database connection error."]);
            exit();
        }
    }

    public static function getInstance() {
        if (self::$instance == null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->conn;
    }
}
?>
