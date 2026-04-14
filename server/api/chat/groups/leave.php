<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../utils/jwt.php';

$auth = JWT::verifyAuth();
$userId = $auth['user_id'];

$input = json_decode(file_get_contents('php://input'), true);
$groupId = (int)($input['group_id'] ?? 0);

if (!$groupId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Group ID is required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Safety check: Is this user the OWNER?
    $stmt = $db->prepare("SELECT created_by FROM chat_groups WHERE id = ?");
    $stmt->execute([$groupId]);
    $group = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$group) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Group not found']);
        exit;
    }
    
    if ((int)$group['created_by'] === $userId) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Creator cannot leave an active group. You must disband it.']);
        exit;
    }
    
    $delete = $db->prepare("DELETE FROM chat_group_members WHERE group_id = ? AND user_id = ?");
    $delete->execute([$groupId, $userId]);
    
    echo json_encode(['status' => 'success', 'message' => 'Successfully left the group']);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
