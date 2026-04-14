<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../utils/jwt.php';

$auth = JWT::verifyAuth();
$userId = $auth['user_id'];

$groupId = (int)($_GET['group_id'] ?? 0);
$lastId = (int)($_GET['last_id'] ?? 0);

if (!$groupId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Group ID is required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Check if member
    $check = $db->prepare("SELECT id FROM chat_group_members WHERE group_id = ? AND user_id = ?");
    $check->execute([$groupId, $userId]);
    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Not a member of this group']);
        exit;
    }
    
    $stmt = $db->prepare("
        SELECT m.id, m.sender_id, m.message, m.created_at, m.updated_at,
               u.name as sender_name, u.avatarUrl as sender_avatar,
               m.file_url, m.file_type, m.reply_to_id, m.reactions, m.is_edited
        FROM group_messages m
        INNER JOIN users u ON m.sender_id = u.id
        WHERE m.group_id = ? AND m.id > ? AND m.is_deleted = 0
        ORDER BY m.created_at ASC
    ");
    $stmt->execute([$groupId, $lastId]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['status' => 'success', 'messages' => $messages]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
