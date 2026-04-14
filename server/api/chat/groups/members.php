<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../utils/jwt.php';

$auth = JWT::verifyAuth();
$userId = $auth['user_id'];

$groupId = (int)($_GET['group_id'] ?? 0);

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
    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Not a member']);
        exit;
    }

    $stmt = $db->prepare("
        SELECT u.id, u.name, u.avatarUrl, u.role as student_role, gm.role as group_role
        FROM chat_group_members gm
        INNER JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ?
    ");
    $stmt->execute([$groupId]);
    $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['status' => 'success', 'members' => $members]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
