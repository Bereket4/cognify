<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/jwt.php';

$auth = JWT::verifyAuth();
$userId = $auth['user_id'];

$input = json_decode(file_get_contents('php://input'), true);
$messageId = (int)($input['message_id'] ?? 0);
$emoji = trim($input['emoji'] ?? '');
$type = $input['type'] ?? 'private'; // 'private' or 'group'

if (!$messageId || !$emoji) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Message ID and emoji are required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    $table = ($type === 'group') ? 'group_messages' : 'direct_messages';
    
    // Fetch existing reactions
    $stmt = $db->prepare("SELECT reactions FROM $table WHERE id = ?");
    $stmt->execute([$messageId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$row) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Message not found']);
        exit;
    }
    
    $reactions = $row['reactions'] ? json_decode($row['reactions'], true) : [];
    
    if (!isset($reactions[$emoji])) {
        $reactions[$emoji] = [];
    }
    
    // Toggle user ID in the emoji array
    if (in_array($userId, $reactions[$emoji])) {
        $reactions[$emoji] = array_values(array_filter($reactions[$emoji], fn($id) => $id !== $userId));
        if (empty($reactions[$emoji])) unset($reactions[$emoji]);
    } else {
        $reactions[$emoji][] = $userId;
    }
    
    $updatedReactions = json_encode($reactions);
    $update = $db->prepare("UPDATE $table SET reactions = ? WHERE id = ?");
    $update->execute([$updatedReactions, $messageId]);
    
    echo json_encode(['status' => 'success', 'reactions' => $reactions]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
