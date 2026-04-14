<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../utils/jwt.php';

$auth = JWT::verifyAuth();
$userId = $auth['user_id'];

try {
    $db = Database::getInstance()->getConnection();
    
    // Fetch groups where user is a member
    $stmt = $db->prepare("
        SELECT 
            g.id, 
            g.name, 
            g.description, 
            g.avatar_url,
            gm.role,
            (SELECT message FROM group_messages WHERE group_id = g.id ORDER BY created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM group_messages WHERE group_id = g.id ORDER BY created_at DESC LIMIT 1) as last_time,
            (SELECT id FROM call_sessions WHERE group_id = g.id AND status = 'active' LIMIT 1) as active_call_id
        FROM chat_groups g
        INNER JOIN chat_group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ?
        ORDER BY last_time DESC
    ");
    $stmt->execute([$userId]);
    $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['status' => 'success', 'groups' => $groups]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
