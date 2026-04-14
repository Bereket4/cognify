<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "Synchronizing Achievement Architecture...\n";

try {
    // Add achievement_points if not exists
    $db->exec("ALTER TABLE users ADD COLUMN achievement_points INT DEFAULT 0");
    echo "Added achievement_points column.\n";
    
    // Refresh last_active_at to be precise
    echo "Achievement grid initialized!\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "Achievement column already operational.\n";
    } else {
        echo "Migration Conflict: " . $e->getMessage() . "\n";
    }
}
?>
