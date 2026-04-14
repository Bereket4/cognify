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
$data = json_decode(file_get_contents("php://input"));
$note_id = isset($_GET['id']) ? $_GET['id'] : (isset($data->id) ? $data->id : null);

if (!empty($note_id) && !empty($data->title)) {
    $database = new Database();
    $db = $database->getConnection();

    // Verify ownership
    $check_query = "SELECT id FROM notes WHERE id = :id AND user_id = :user_id";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(':id', $note_id);
    $check_stmt->bindParam(':user_id', $user['user_id']);
    $check_stmt->execute();

    if ($check_stmt->rowCount() == 0) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Not authorized to update this note."]);
        exit();
    }

    $query = "UPDATE notes SET title = :title, content = :content, project_id = :project_id WHERE id = :id";
    $stmt = $db->prepare($query);

    $title = htmlspecialchars(strip_tags($data->title));
    $content = isset($data->content) ? $data->content : '';
    $project_id = isset($data->project_id) ? $data->project_id : null;

    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':content', $content);
    $stmt->bindParam(':project_id', $project_id);
    $stmt->bindParam(':id', $note_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Note updated successfully"]);
    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Unable to update note"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data. Note ID and title are required."]);
}
?>
