<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../utils/jwt.php';

$auth = JWT::verifyAuth();
$userId = $auth['user_id'];

$input = json_decode(file_get_contents('php://input'), true);
$name = trim($input['name'] ?? '');
$description = trim($input['description'] ?? '');
$memberIds = $input['members'] ?? []; // Array of student IDs

if (!$name) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Group name is required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    $db->beginTransaction();
    
    // Create group
    $stmt = $db->prepare("INSERT INTO chat_groups (name, description, created_by) VALUES (?, ?, ?)");
    $stmt->execute([$name, $description, $userId]);
    $groupId = $db->lastInsertId();
    
    // Add creator as owner
    $stmt = $db->prepare("INSERT INTO chat_group_members (group_id, user_id, role) VALUES (?, ?, 'owner')");
    $stmt->execute([$groupId, $userId]);
    
    // Add other members
    $stmt = $db->prepare("INSERT INTO chat_group_members (group_id, user_id, role) VALUES (?, ?, 'member')");
    foreach ($memberIds as $mId) {
        if ($mId == $userId) continue;
        $stmt->execute([$groupId, $mId]);
    }
    
    $db->commit();
    echo json_encode(['status' => 'success', 'group_id' => $groupId]);
    
} catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
