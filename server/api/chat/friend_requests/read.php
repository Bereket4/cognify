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

$query = "SELECT fr.id, fr.sender_id, fr.receiver_id, fr.status, fr.created_at,
          u.id as user_id, u.name, u.email, u.avatarUrl, u.role,
          CASE WHEN fr.sender_id = :current_user THEN fr.receiver_id ELSE fr.sender_id END as other_user_id
          FROM friend_requests fr
          JOIN users u ON u.id = CASE WHEN fr.sender_id = :current_user THEN fr.receiver_id ELSE fr.sender_id END
          WHERE (fr.sender_id = :current_user OR fr.receiver_id = :current_user)
          AND fr.status = 'pending'
          ORDER BY fr.created_at DESC";
$stmt = $db->prepare($query);
$stmt->bindParam(':current_user', $user['user_id']);
$stmt->execute();

$requests = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $row['is_sent_by_me'] = (int)$row['sender_id'] === (int)$user['user_id'];
    $requests[] = $row;
}

http_response_code(200);
echo json_encode(["status" => "success", "data" => $requests]);
?>
