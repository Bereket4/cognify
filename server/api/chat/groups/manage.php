<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../utils/jwt.php';

$auth = JWT::verifyAuth();
$userId = $auth['user_id'];

$input = json_decode(file_get_contents('php://input'), true);
$groupId = (int)($input['group_id'] ?? 0);
$action = $input['action'] ?? '';

if (!$groupId || !$action) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Group ID and Action are required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Check if user is the OWNER or is a Global ADMIN
    $stmt = $db->prepare("
        SELECT g.created_by, u.role 
        FROM chat_groups g 
        INNER JOIN users u ON u.id = ?
        WHERE g.id = ?
    ");
    $stmt->execute([$userId, $groupId]);
    $perms = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$perms) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Group context unavailable']);
        exit;
    }
    
    $isOwner = (int)$perms['created_by'] === $userId;
    $isAdmin = $perms['role'] === 'admin';

    if (!$isOwner && !$isAdmin) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Administrative privileges required']);
        exit;
    }

    switch ($action) {
        case 'ADD_MEMBER':
            $newMemberId = (int)$input['target_user_id'];
            $stmt = $db->prepare("INSERT IGNORE INTO chat_group_members (group_id, user_id, role) VALUES (?, ?, 'member')");
            $stmt->execute([$groupId, $newMemberId]);
            echo json_encode(['status' => 'success', 'message' => 'Member added']);
            break;
            
        case 'REMOVE_MEMBER':
            $targetId = (int)$input['target_user_id'];
            if ($targetId === $userId) {
                echo json_encode(['status' => 'error', 'message' => 'Creator cannot be removed']);
                exit;
            }
            $stmt = $db->prepare("DELETE FROM chat_group_members WHERE group_id = ? AND user_id = ?");
            $stmt->execute([$groupId, $targetId]);
            echo json_encode(['status' => 'success', 'message' => 'Member removed']);
            break;
            
        case 'UPDATE_PROFILE':
            $name = trim($input['name'] ?? '');
            $description = trim($input['description'] ?? '');
            $avatarUrl = trim($input['avatar_url'] ?? '');
            
            $stmt = $db->prepare("UPDATE chat_groups SET name = ?, description = ?, avatar_url = ? WHERE id = ?");
            $stmt->execute([$name, $description, $avatarUrl, $groupId]);
            echo json_encode(['status' => 'success', 'message' => 'Profile updated']);
            break;
            
        case 'DELETE_GROUP':
            $stmt = $db->prepare("DELETE FROM chat_groups WHERE id = ?");
            $stmt->execute([$groupId]);
            echo json_encode(['status' => 'success', 'message' => 'Group disbanded']);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
            break;
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
