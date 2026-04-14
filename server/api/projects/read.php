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
$project_id = isset($_GET['id']) ? $_GET['id'] : null;

$database = new Database();
$db = $database->getConnection();

if ($project_id) {
    $query = "SELECT id, name, description, created_at FROM projects WHERE id = :id AND user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $project_id);
    $stmt->bindParam(':user_id', $user['user_id']);
    $stmt->execute();
    $project = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($project) {
        http_response_code(200);
        echo json_encode(["status" => "success", "data" => $project]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Project not found"]);
    }
} else {
    $query = "SELECT id, name, description, created_at FROM projects WHERE user_id = :user_id ORDER BY id DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['user_id']);
    $stmt->execute();

    $projects = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if (isset($_GET['stats'])) {
            $task_q = "SELECT COUNT(*) FROM tasks WHERE project_id = :project_id";
            $t_stmt = $db->prepare($task_q);
            $t_stmt->bindParam(':project_id', $row['id']);
            $t_stmt->execute();
            $row['task_count'] = $t_stmt->fetchColumn();

            $note_q = "SELECT COUNT(*) FROM notes WHERE project_id = :project_id";
            $n_stmt = $db->prepare($note_q);
            $n_stmt->bindParam(':project_id', $row['id']);
            $n_stmt->execute();
            $row['note_count'] = $n_stmt->fetchColumn();
        }
        $projects[] = $row;
    }

    http_response_code(200);
    echo json_encode(["status" => "success", "data" => $projects]);
}
?>
