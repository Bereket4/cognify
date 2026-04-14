<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$user = JWT::verifyAuth();
$request_id = isset($_GET['id']) ? (int)$_GET['id'] : null;

if (!$request_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Request ID is required"]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

$query = "DELETE FROM friend_requests WHERE id = :id AND sender_id = :user_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':id', $request_id);
$stmt->bindParam(':user_id', $user['user_id']);

if ($stmt->execute() && $stmt->rowCount() > 0) {
    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Friend request cancelled"]);
} else {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "Friend request not found"]);
}
?>
