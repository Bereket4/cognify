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

if (!empty($data->name)) {
    $database = new Database();
    $db = $database->getConnection();

    $query = "INSERT INTO projects (user_id, name, description) VALUES (:user_id, :name, :description)";
    $stmt = $db->prepare($query);

    $name = htmlspecialchars(strip_tags($data->name));
    $description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : null;

    $stmt->bindParam(':user_id', $user['user_id']);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':description', $description);

    if ($stmt->execute()) {
        $project_id = $db->lastInsertId();
        http_response_code(201);
        echo json_encode([
            "status" => "success", 
            "message" => "Project created successfully", 
            "project_id" => $project_id
        ]);
    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Unable to create project"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data. Project name is required."]);
}
?>
