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

// Select all students, calculating online status (active in last 5 mins) and points
$query = "SELECT id, name, email, avatarUrl, streak_count, achievement_points, last_active_at,
          IF(last_active_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE), 1, 0) as is_online
          FROM users 
          WHERE role = 'student'
          ORDER BY achievement_points DESC, streak_count DESC, name ASC";

$stmt = $db->prepare($query);
$stmt->execute();

$users = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $row['is_online'] = (bool)$row['is_online'];
    $users[] = $row;
}

echo json_encode([
    "status" => "success",
    "data" => $users
]);
?>
