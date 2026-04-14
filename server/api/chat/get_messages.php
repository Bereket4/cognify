<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/jwt.php';

$auth = JWT::verifyAuth();
$userId = $auth['user_id'];

$otherId = (int)($_GET['other_id'] ?? 0);
$lastId = (int)($_GET['last_id'] ?? 0);

if (!$otherId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Other user ID is required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Optional: Check if friends
    
    $stmt = $db->prepare("
        SELECT id, sender_id, receiver_id, message, is_read, created_at, updated_at,
               file_url, file_type, reply_to_id, reactions, is_edited
        FROM direct_messages 
        WHERE id > ? AND (
            (sender_id = ? AND receiver_id = ?) OR 
            (sender_id = ? AND receiver_id = ?)
        )
        ORDER BY created_at ASC
    ");
    $stmt->execute([$lastId, $userId, $otherId, $otherId, $userId]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Mark messages as read
    $mark = $db->prepare("UPDATE direct_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0");
    $mark->execute([$otherId, $userId]);
    
    echo json_encode(['status' => 'success', 'messages' => $messages]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
