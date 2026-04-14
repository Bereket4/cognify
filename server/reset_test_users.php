<?php
require_once __DIR__ . '/config/database.php';
try {
    $db = Database::getInstance()->getConnection();
    $password = password_hash('test123', PASSWORD_BCRYPT);
    
    $stmt = $db->prepare("UPDATE users SET password = ?");
    $stmt->execute([$password]);
    
    echo "Successfully reset passwords for all users to 'test123'\n";
    echo "Rows affected: " . $stmt->rowCount() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
