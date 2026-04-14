<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "Starting Leaderboard Migration...\n";

try {
    // Add last_active_at
    $db->exec("ALTER TABLE users ADD COLUMN last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    echo "Added last_active_at column.\n";
    
    // Add streak_count
    $db->exec("ALTER TABLE users ADD COLUMN streak_count INT DEFAULT 0");
    echo "Added streak_count column.\n";
    
    // Add last_streak_update
    $db->exec("ALTER TABLE users ADD COLUMN last_streak_update DATE DEFAULT NULL");
    echo "Added last_streak_update column.\n";
    
    echo "Migration Complete!\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "Columns already exist. Skipping.\n";
    } else {
        echo "Migration Error: " . $e->getMessage() . "\n";
    }
}
?>
