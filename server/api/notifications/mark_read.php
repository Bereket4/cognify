<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$user = JWT::verifyAuth();

$database = new Database();
$db = $database->getConnection();

// Mark all as read for this user
$query = "UPDATE notifications SET is_read = TRUE WHERE user_id = :user_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $user['user_id']);

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Notifications marked as read"]);
} else {
    http_response_code(503);
    echo json_encode(["status" => "error", "message" => "Unable to update notifications"]);
}
?>
