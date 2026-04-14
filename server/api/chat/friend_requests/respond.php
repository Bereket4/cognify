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

if (empty($data->request_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Request ID is required"]);
    exit();
}

$request_id = (int)$data->request_id;
$action = isset($data->action) ? $data->action : 'accept';

$query = "SELECT * FROM friend_requests WHERE id = :id AND receiver_id = :user_id AND status = 'pending'";
$stmt = $db->prepare($query);
$stmt->bindParam(':id', $request_id);
$stmt->bindParam(':user_id', $user['user_id']);
$stmt->execute();

if ($stmt->rowCount() === 0) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "Friend request not found"]);
    exit();
}

$request = $stmt->fetch(PDO::FETCH_ASSOC);

if ($action === 'reject') {
    $update = $db->prepare("UPDATE friend_requests SET status = 'rejected' WHERE id = :id");
    $update->bindParam(':id', $request_id);
    $update->execute();
    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Friend request rejected"]);
    exit();
}

$user_id_1 = min($user['user_id'], $request['sender_id']);
$user_id_2 = max($user['user_id'], $request['sender_id']);

$insertFriend = $db->prepare("INSERT INTO friendships (user_id_1, user_id_2) VALUES (:u1, :u2)");
$insertFriend->bindParam(':u1', $user_id_1);
$insertFriend->bindParam(':u2', $user_id_2);

if ($insertFriend->execute()) {
    $deleteReq = $db->prepare("DELETE FROM friend_requests WHERE id = :id");
    $deleteReq->bindParam(':id', $request_id);
    $deleteReq->execute();

    $notif = $user['name'] . " accepted your friend request";
    $nQuery = "INSERT INTO notifications (user_id, message) VALUES (:user_id, :message)";
    $nStmt = $db->prepare($nQuery);
    $nStmt->bindParam(':user_id', $request['sender_id']);
    $nStmt->bindParam(':message', $notif);
    $nStmt->execute();

    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Friend request accepted"]);
} else {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Unable to accept friend request"]);
}
?>
