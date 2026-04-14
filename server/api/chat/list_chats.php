<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/jwt.php';

$auth = JWT::verifyAuth();
$userId = $auth['user_id'];

try {
    $db = Database::getInstance()->getConnection();
    
    // Fetch all friends and their latest message
    $stmt = $db->prepare("
        SELECT 
            u.id, 
            u.name, 
            u.email, 
            u.avatarUrl as profile_picture,
            (SELECT message FROM direct_messages 
             WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)
             ORDER BY created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM direct_messages 
             WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)
             ORDER BY created_at DESC LIMIT 1) as last_time,
            (SELECT COUNT(*) FROM direct_messages 
             WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count,
            (SELECT id FROM call_sessions 
             WHERE status = 'active' AND 
             ((initiator_id = u.id AND receiver_id = ?) OR (initiator_id = ? AND receiver_id = u.id))
             LIMIT 1) as active_call_id
        FROM users u
        INNER JOIN friendships f ON (f.user_id_1 = u.id AND f.user_id_2 = ?) OR (f.user_id_2 = u.id AND f.user_id_1 = ?)
        ORDER BY last_time DESC
    ");
    $stmt->execute([$userId, $userId, $userId, $userId, $userId, $userId, $userId, $userId, $userId]);
    $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['status' => 'success', 'chats' => $chats]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
