<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$user = JWT::verifyAuth();

$database = new Database();
$db = $database->getConnection();

$query = "SELECT * FROM notifications WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 50";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $user['user_id']);
$stmt->execute();

$notifications = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    // Cast is_read back to bool for easy frontend consumption
    $row['is_read'] = $row['is_read'] ? true : false;
    $notifications[] = $row;
}

http_response_code(200);
echo json_encode(["status" => "success", "data" => $notifications]);
?>
