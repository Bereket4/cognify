<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/jwt.php';

$auth = JWT::verifyAuth();
$userId = $auth['user_id'];

$input = json_decode(file_get_contents('php://input'), true);
$receiverId = (int)($input['receiver_id'] ?? 0);
$message = trim($input['message'] ?? '');
$fileUrl = $input['file_url'] ?? null;
$fileType = $input['file_type'] ?? null;
$replyToId = isset($input['reply_to_id']) ? (int)$input['reply_to_id'] : null;

if (!$receiverId || (!$message && !$fileUrl)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Receiver ID and content (message/file) are required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Check if they are friends
    $check = $db->prepare("
        SELECT id FROM friendships 
        WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)
    ");
    $check->execute([$userId, $receiverId, $receiverId, $userId]);
    
    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'You can only message friends']);
        exit;
    }
    
    $stmt = $db->prepare("INSERT INTO direct_messages (sender_id, receiver_id, message, file_url, file_type, reply_to_id) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$userId, $receiverId, $message, $fileUrl, $fileType, $replyToId]);
    
    echo json_encode(['status' => 'success', 'message_id' => $db->lastInsertId()]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
