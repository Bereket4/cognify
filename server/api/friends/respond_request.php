<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/jwt.php';

$auth = JWT::verifyAuth();
$user_id = $auth['user_id'];

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['request_id']) || !isset($input['action'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'request_id and action are required']);
    exit;
}

$request_id = (int)$input['request_id'];
$action = $input['action'];

if (!in_array($action, ['accept', 'reject'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    $checkRequest = $db->prepare("SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = 'pending'");
    $checkRequest->execute([$request_id, $user_id]);
    $request = $checkRequest->fetch(PDO::FETCH_ASSOC);
    
    if (!$request) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Request not found']);
        exit;
    }
    
    if ($action === 'accept') {
        $user_id_1 = min($request['sender_id'], $user_id);
        $user_id_2 = max($request['sender_id'], $user_id);
        
        $checkFriendship = $db->prepare("SELECT id FROM friendships WHERE user_id_1 = ? AND user_id_2 = ?");
        $checkFriendship->execute([$user_id_1, $user_id_2]);
        if (!$checkFriendship->fetch()) {
            $createFriendship = $db->prepare("INSERT INTO friendships (user_id_1, user_id_2) VALUES (?, ?)");
            $createFriendship->execute([$user_id_1, $user_id_2]);
        }
        
        $updateRequest = $db->prepare("UPDATE friend_requests SET status = 'accepted' WHERE id = ?");
        $updateRequest->execute([$request_id]);
        
        echo json_encode(['status' => 'success', 'message' => 'Friend request accepted']);
    } else {
        $updateRequest = $db->prepare("DELETE FROM friend_requests WHERE id = ?");
        $updateRequest->execute([$request_id]);
        
        echo json_encode(['status' => 'success', 'message' => 'Friend request rejected']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
