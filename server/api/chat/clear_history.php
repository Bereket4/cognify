<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/jwt.php';

$auth = JWT::verifyAuth();
$userId = $auth['user_id'];

$input = json_decode(file_get_contents('php://input'), true);
$partnerId = (int)($input['partner_id'] ?? 0);

if (!$partnerId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Partner ID is required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    $stmt = $db->prepare("
        DELETE FROM direct_messages 
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)
    ");
    $stmt->execute([$userId, $partnerId, $partnerId, $userId]);
    
    echo json_encode(['status' => 'success', 'message' => 'History purged']);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
