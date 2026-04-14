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
$project_id = isset($_GET['id']) ? $_GET['id'] : (isset($data->id) ? $data->id : null);

if (!empty($project_id) && !empty($data->name)) {
    $database = new Database();
    $db = $database->getConnection();

    // Verify ownership
    $check_query = "SELECT id FROM projects WHERE id = :id AND user_id = :user_id";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(':id', $project_id);
    $check_stmt->bindParam(':user_id', $user['user_id']);
    $check_stmt->execute();

    if ($check_stmt->rowCount() == 0) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Not authorized to update this project."]);
        exit();
    }

    $query = "UPDATE projects SET name = :name, description = :description WHERE id = :id";
    $stmt = $db->prepare($query);

    $name = htmlspecialchars(strip_tags($data->name));
    $description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : null;

    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':description', $description);
    $stmt->bindParam(':id', $project_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Project updated successfully"]);
    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Unable to update project"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data. Project ID and name are required."]);
}
?>
