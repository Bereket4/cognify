<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$user = JWT::verifyAuth();
$data = json_decode(file_get_contents("php://input"));
$database = new Database();
$db = $database->getConnection();

if (empty($data->receiver_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Receiver ID is required"]);
    exit();
}

$receiver_id = (int)$data->receiver_id;

if ($receiver_id === (int)$user['user_id']) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Cannot send friend request to yourself"]);
    exit();
}

$checkFriend = $db->prepare("SELECT id FROM friendships WHERE 
    (user_id_1 = :user1 AND user_id_2 = :user2) OR 
    (user_id_1 = :user2 AND user_id_2 = :user1)");
$checkFriend->bindParam(':user1', $user['user_id']);
$checkFriend->bindParam(':user2', $receiver_id);
$checkFriend->execute();
if ($checkFriend->rowCount() > 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Already friends"]);
    exit();
}

$checkExisting = $db->prepare("SELECT id, status FROM friend_requests WHERE 
    (sender_id = :user1 AND receiver_id = :user2) OR 
    (sender_id = :user2 AND receiver_id = :user1)");
$checkExisting->bindParam(':user1', $user['user_id']);
$checkExisting->bindParam(':user2', $receiver_id);
$checkExisting->execute();
if ($checkExisting->rowCount() > 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Friend request already exists"]);
    exit();
}

$query = "INSERT INTO friend_requests (sender_id, receiver_id) VALUES (:sender_id, :receiver_id)";
$stmt = $db->prepare($query);
$stmt->bindParam(':sender_id', $user['user_id']);
$stmt->bindParam(':receiver_id', $receiver_id);

if ($stmt->execute()) {
    $notif = $user['name'] . " sent you a friend request";
    $nQuery = "INSERT INTO notifications (user_id, message) VALUES (:user_id, :message)";
    $nStmt = $db->prepare($nQuery);
    $nStmt->bindParam(':user_id', $receiver_id);
    $nStmt->bindParam(':message', $notif);
    $nStmt->execute();

    http_response_code(201);
    echo json_encode(["status" => "success", "message" => "Friend request sent"]);
} else {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Unable to send friend request"]);
}
?>
