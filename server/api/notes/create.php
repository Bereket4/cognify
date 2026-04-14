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

    $query = "INSERT INTO notes (project_id, user_id, title, content, type) VALUES (:project_id, :user_id, :title, :content, :type)";
    $stmt = $db->prepare($query);
    
    $type = isset($data->type) ? $data->type : 'general';

    $project_id = isset($data->project_id) ? $data->project_id : null;
    $title = htmlspecialchars(strip_tags($data->title));
    $content = isset($data->content) ? $data->content : ''; // Content can be raw HTML from Quill

    $stmt->bindParam(':project_id', $project_id);
    $stmt->bindParam(':user_id', $user['user_id']);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':content', $content);
    $stmt->bindParam(':type', $type);

    if ($stmt->execute()) {
        $note_id = $db->lastInsertId();
        http_response_code(201);
        echo json_encode([
            "status" => "success", 
            "message" => "Note created successfully", 
            "note_id" => $note_id
        ]);
    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Unable to create note"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data. Note title is required."]);
}
?>
