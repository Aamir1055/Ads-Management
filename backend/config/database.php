<?php
/**
 * Database Configuration
 * 
 * Update these credentials to match your database setup
 */

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'ads_reporting'); // Change this to your database name
define('DB_USER', 'root'); // Change this to your database username
define('DB_PASS', ''); // Change this to your database password
define('DB_CHARSET', 'utf8mb4');

class Database {
    private $connection = null;
    private static $instance = null;
    
    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
            
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed. Please check your configuration.");
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function prepare($sql) {
        return $this->connection->prepare($sql);
    }
    
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }
    
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }
    
    public function commit() {
        return $this->connection->commit();
    }
    
    public function rollback() {
        return $this->connection->rollback();
    }
}

// Helper function to get database instance
function getDB() {
    return Database::getInstance();
}

// Test the database connection
function testDatabaseConnection() {
    try {
        $db = getDB();
        $stmt = $db->prepare("SELECT 1 as test");
        $stmt->execute();
        return true;
    } catch (Exception $e) {
        error_log("Database test failed: " . $e->getMessage());
        return false;
    }
}
?>
