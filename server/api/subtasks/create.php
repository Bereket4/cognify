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

if (!empty($data->task_id) && !empty($data->title)) {
    $database = new Database();
    $db = $database->getConnection();

    // Verify task ownership or admin
    if ($user['role'] !== 'admin') {
        $ch_query = "SELECT id FROM tasks WHERE id = :task_id AND user_id = :user_id";
        $ch_stmt = $db->prepare($ch_query);
        $ch_stmt->bindParam(':task_id', $data->task_id);
        $ch_stmt->bindParam(':user_id', $user['user_id']);
        $ch_stmt->execute();
        if ($ch_stmt->rowCount() == 0) {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Not authorized"]);
            exit();
        }
    }

    $query = "INSERT INTO subtasks (task_id, title) VALUES (:task_id, :title)";
    $stmt = $db->prepare($query);
    $title = htmlspecialchars(strip_tags($data->title));
    $stmt->bindParam(':task_id', $data->task_id);
    $stmt->bindParam(':title', $title);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["status" => "success", "message" => "Subtask created", "id" => $db->lastInsertId()]);
    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Unable to create subtask"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data"]);
}
?>
