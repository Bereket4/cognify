<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

$user = JWT::verifyAuth();
if (!$user) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

$query = "UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = :id";
$stmt = $db->prepare($query);
$stmt->bindParam(':id', $user['user_id']);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Heartbeat synchronized"]);
} else {
    echo json_encode(["status" => "error", "message" => "Heartbeat lost"]);
}
?>
