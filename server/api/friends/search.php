<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/jwt.php';

$auth = JWT::verifyAuth();
$user_id = $auth['user_id'];

try {
    $db = Database::getInstance()->getConnection();
    
    $search = isset($_GET['q']) ? trim($_GET['q']) : '';
    
    if (empty($search)) {
        echo json_encode(['status' => 'success', 'data' => []]);
        exit;
    }
    
    $stmt = $db->prepare("
        SELECT id, name, email, role, avatarUrl as profile_picture 
        FROM users 
        WHERE (name LIKE ? OR email LIKE ?)
        AND id != ?
        AND id NOT IN (
            SELECT receiver_id FROM friend_requests WHERE sender_id = ? AND status = 'pending'
        )
        AND id NOT IN (
            SELECT sender_id FROM friend_requests WHERE receiver_id = ? AND status = 'pending'
        )
        AND id NOT IN (
            SELECT user_id_2 FROM friendships WHERE user_id_1 = ?
        )
        AND id NOT IN (
            SELECT user_id_1 FROM friendships WHERE user_id_2 = ?
        )
        LIMIT 20
    ");
    
    $searchTerm = "%{$search}%";
    $stmt->execute([$searchTerm, $searchTerm, $user_id, $user_id, $user_id, $user_id, $user_id]);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['status' => 'success', 'data' => $users]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
