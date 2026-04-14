<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/jwt.php';

$auth = JWT::verifyAuth();
$sender_id = $auth['user_id'];

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['receiver_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'receiver_id is required']);
    exit;
}

$receiver_id = (int)$input['receiver_id'];

if ($sender_id === $receiver_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Cannot send friend request to yourself']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    $checkUser = $db->prepare("SELECT id FROM users WHERE id = ?");
    $checkUser->execute([$receiver_id]);
    if (!$checkUser->fetch()) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'User not found']);
        exit;
    }
    
    $checkFriendship = $db->prepare("
        SELECT id FROM friendships 
        WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)
    ");
    $checkFriendship->execute([$sender_id, $receiver_id, $receiver_id, $sender_id]);
    if ($checkFriendship->fetch()) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Already friends']);
        exit;
    }

    // Check if there is an ACTIVE PENDING request
    $checkPending = $db->prepare("
        SELECT sender_id FROM friend_requests 
        WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) 
          AND status = 'pending'
    ");
    $checkPending->execute([$sender_id, $receiver_id, $receiver_id, $sender_id]);
    $existingPending = $checkPending->fetch(PDO::FETCH_ASSOC);
    
    if ($existingPending) {
        http_response_code(400);
        if ($existingPending['sender_id'] == $sender_id) {
            echo json_encode(['status' => 'error', 'message' => 'Friend request already sent']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'User already sent you a request. Please check your notifications.']);
        }
        exit;
    }

    // Self-heal the database: delete any old accepted/orphaned requests between these two users
    $cleanup = $db->prepare("
        DELETE FROM friend_requests 
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ");
    $cleanup->execute([$sender_id, $receiver_id, $receiver_id, $sender_id]);
    
    $stmt = $db->prepare("INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)");
    $stmt->execute([$sender_id, $receiver_id]);
    
    echo json_encode(['status' => 'success', 'message' => 'Friend request sent', 'id' => $db->lastInsertId()]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
