<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../utils/jwt.php';

$auth = JWT::verifyAuth();
$userId = $auth['user_id'];

$groupId = (int)($_GET['group_id'] ?? 0);
$query = trim($_GET['q'] ?? '');

if (!$groupId || !$query) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Group ID and Query are required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Find users NOT in the group and match query
    $stmt = $db->prepare("
        SELECT id, name, email, avatarUrl as profile_picture
        FROM users
        WHERE name LIKE ? AND id != ?
        AND id NOT IN (SELECT user_id FROM chat_group_members WHERE group_id = ?)
        LIMIT 10
    ");
    $stmt->execute(["%$query%", $userId, $groupId]);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['status' => 'success', 'users' => $users]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
