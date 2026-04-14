<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

JWT::verifyAdmin(); // Verifies auth AND admin role

$task_id = isset($_GET['id']) ? $_GET['id'] : null;

if (!empty($task_id)) {
    $database = new Database();
    $db = $database->getConnection();

    $query = "DELETE FROM tasks WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $task_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Task was deleted by admin."]);
    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Unable to delete task."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Task ID is required."]);
}
?>
