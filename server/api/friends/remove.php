<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/jwt.php';

$auth = JWT::verifyAuth();
$user_id = $auth['user_id'];

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['friend_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'friend_id is required']);
    exit;
}

$friend_id = (int)$input['friend_id'];

try {
    $db = Database::getInstance()->getConnection();
    
    $checkFriendship = $db->prepare("
        SELECT id FROM friendships 
        WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)
    ");
    $checkFriendship->execute([$user_id, $friend_id, $friend_id, $user_id]);
    if (!$checkFriendship->fetch()) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Not friends with this user']);
        exit;
    }
    
    $stmt = $db->prepare("DELETE FROM friendships WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)");
    $stmt->execute([$user_id, $friend_id, $friend_id, $user_id]);
    
    $deleteRequests = $db->prepare("
        DELETE FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ");
    $deleteRequests->execute([$user_id, $friend_id, $friend_id, $user_id]);

    $deleteMessages = $db->prepare("
        DELETE FROM direct_messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ");
    $deleteMessages->execute([$user_id, $friend_id, $friend_id, $user_id]);
    
    echo json_encode(['status' => 'success', 'message' => 'Friend removed']);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
