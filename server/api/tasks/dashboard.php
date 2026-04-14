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

$query = "SELECT COUNT(*) as total_tasks, 
                 SUM(IF(status = 'completed', 1, 0)) as completed_tasks,
                 SUM(IF(status = 'pending', 1, 0)) as pending_tasks
          FROM tasks WHERE user_id = :user_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $user['user_id']);
$stmt->execute();

$row = $stmt->fetch(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode([
    "status" => "success",
    "data" => [
        "total" => (int)$row['total_tasks'],
        "completed" => (int)$row['completed_tasks'],
        "pending" => (int)$row['pending_tasks']
    ]
]);
?>
