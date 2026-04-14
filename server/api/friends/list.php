<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/jwt.php';

$auth = JWT::verifyAuth();
$user_id = $auth['user_id'];

try {
    $db = Database::getInstance()->getConnection();
    
    $stmt = $db->prepare("
        SELECT f.id as friendship_id, f.created_at as friends_since,
               CASE 
                   WHEN f.user_id_1 = ? THEN f.user_id_2 
                   ELSE f.user_id_1 
               END as friend_id,
               u.id, u.name, u.email, u.avatarUrl, u.last_active_at
        FROM friendships f
        JOIN users u ON u.id = CASE 
            WHEN f.user_id_1 = ? THEN f.user_id_2 
            ELSE f.user_id_1 
        END
        WHERE f.user_id_1 = ? OR f.user_id_2 = ?
        ORDER BY u.name ASC
    ");
    $stmt->execute([$user_id, $user_id, $user_id, $user_id]);
    $friends = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['status' => 'success', 'data' => $friends]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
