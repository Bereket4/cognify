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

    $query = "INSERT INTO tags (user_id, name, color) VALUES (:user_id, :name, :color)";
    $stmt = $db->prepare($query);

    $name = htmlspecialchars(strip_tags($data->name));
    $color = isset($data->color) ? htmlspecialchars(strip_tags($data->color)) : '#6B7280';

    $stmt->bindParam(':user_id', $user['user_id']);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':color', $color);

    if ($stmt->execute()) {
        $tag_id = $db->lastInsertId();
        http_response_code(201);
        echo json_encode([
            "status" => "success", 
            "message" => "Tag created successfully", 
            "id" => $tag_id
        ]);
    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Unable to create tag"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data. Tag name is required."]);
}
?>
