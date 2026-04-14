<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../utils/jwt.php';

$auth = JWT::verifyAuth();
$userId = $auth['user_id'];

$input = json_decode(file_get_contents('php://input'), true);
$groupId = (int)($input['group_id'] ?? 0);
$message = trim($input['message'] ?? '');
$fileUrl = $input['file_url'] ?? null;
$fileType = $input['file_type'] ?? null;
$replyToId = isset($input['reply_to_id']) ? (int)$input['reply_to_id'] : null;

if (!$groupId || (!$message && !$fileUrl)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Group ID and content (message/file) are required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Check membership
    $check = $db->prepare("SELECT id FROM chat_group_members WHERE group_id = ? AND user_id = ?");
    $check->execute([$groupId, $userId]);
    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Not a member of this group']);
        exit;
    }
    
    $stmt = $db->prepare("INSERT INTO group_messages (group_id, sender_id, message, file_url, file_type, reply_to_id) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$groupId, $userId, $message, $fileUrl, $fileType, $replyToId]);
    
    echo json_encode(['status' => 'success', 'message_id' => $db->lastInsertId()]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
