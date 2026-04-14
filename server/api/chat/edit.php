<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/jwt.php';

$auth = JWT::verifyAuth();
$userId = $auth['user_id'];

$input = json_decode(file_get_contents('php://input'), true);
$messageId = (int)($input['message_id'] ?? 0);
$newContent = trim($input['message'] ?? '');
$type = $input['type'] ?? 'private'; // 'private' or 'group'

if (!$messageId || $newContent === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Message ID and new content are required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    $table = ($type === 'group') ? 'group_messages' : 'direct_messages';
    
    // Safety check: Is this user the sender?
    $stmt = $db->prepare("SELECT sender_id FROM $table WHERE id = ?");
    $stmt->execute([$messageId]);
    $msg = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$msg) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Message not found']);
        exit;
    }
    
    if ((int)$msg['sender_id'] !== $userId) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'You can only edit your own messages']);
        exit;
    }
    
    $update = $db->prepare("UPDATE $table SET message = ?, is_edited = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    $update->execute([$newContent, $messageId]);
    
    echo json_encode(['status' => 'success', 'message' => 'Message updated successfully']);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
