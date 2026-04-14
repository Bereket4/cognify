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

if (!empty($data->title)) {
    $database = new Database();
    $db = $database->getConnection();

    try {
        $db->beginTransaction();

        $query = "INSERT INTO tasks (user_id, project_id, title, description, priority, recurring_type, deadline) VALUES (:user_id, :project_id, :title, :description, :priority, :recurring_type, :deadline)";
        $stmt = $db->prepare($query);

        $project_id = isset($data->project_id) ? $data->project_id : null;
        $title = htmlspecialchars(strip_tags($data->title));
        $description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : null;
        $priority = isset($data->priority) ? htmlspecialchars(strip_tags($data->priority)) : 'medium';
        $recurring_type = isset($data->recurring_type) ? htmlspecialchars(strip_tags($data->recurring_type)) : 'none';
        $deadline = isset($data->deadline) && !empty($data->deadline) ? htmlspecialchars(strip_tags($data->deadline)) : null;

        $stmt->bindParam(':user_id', $user['user_id']);
        $stmt->bindParam(':project_id', $project_id);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':priority', $priority);
        $stmt->bindParam(':recurring_type', $recurring_type);
        $stmt->bindParam(':deadline', $deadline);

        if ($stmt->execute()) {
            $task_id = $db->lastInsertId();

            // Handle Tags
            if (isset($data->tag_ids) && is_array($data->tag_ids)) {
                $tag_query = "INSERT INTO task_tags (task_id, tag_id) VALUES (:task_id, :tag_id)";
                $tag_stmt = $db->prepare($tag_query);
                foreach ($data->tag_ids as $tag_id) {
                    $tag_stmt->bindParam(':task_id', $task_id);
                    $tag_stmt->bindParam(':tag_id', $tag_id);
                    $tag_stmt->execute();
                }
            }

            $db->commit();
            http_response_code(201);
            echo json_encode(["status" => "success", "message" => "Task created successfully.", "task_id" => $task_id]);
        } else {
            $db->rollBack();
            http_response_code(503);
            echo json_encode(["status" => "error", "message" => "Unable to create task."]);
        }
    } catch (PDOException $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data. Title is required."]);
}
?>
