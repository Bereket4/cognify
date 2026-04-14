<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/jwt.php';

$auth = JWT::verifyAuth();
$user_id = $auth['user_id'];

try {
    $db = Database::getInstance()->getConnection();
    
    $stmt = $db->prepare("
        SELECT fr.id, fr.sender_id, fr.receiver_id, fr.created_at,
               u.id as user_id, u.name, u.email, u.avatarUrl
        FROM friend_requests fr
        JOIN users u ON u.id = fr.sender_id
        WHERE fr.receiver_id = ? AND fr.status = 'pending'
        ORDER BY fr.created_at DESC
    ");
    $stmt->execute([$user_id]);
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['status' => 'success', 'data' => $requests]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
