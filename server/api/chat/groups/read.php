<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../utils/jwt.php';

$auth = JWT::verifyAuth();
$userId = $auth['user_id'];

$groupId = (int)($_GET['id'] ?? 0);

if (!$groupId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Group ID is required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Check membership
    $check = $db->prepare("SELECT role FROM chat_group_members WHERE group_id = ? AND user_id = ?");
    $check->execute([$groupId, $userId]);
    $membership = $check->fetch(PDO::FETCH_ASSOC);
    
    if (!$membership) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Not a member of this group']);
        exit;
    }
    
    $stmt = $db->prepare("SELECT id, name, description, avatar_url, created_by FROM chat_groups WHERE id = ?");
    $stmt->execute([$groupId]);
    $group = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$group) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Group not found']);
        exit;
    }
    
    $group['role'] = $membership['role'];
    
    echo json_encode(['status' => 'success', 'data' => $group]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
