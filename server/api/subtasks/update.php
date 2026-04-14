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
$id = isset($_GET['id']) ? $_GET['id'] : (isset($data->id) ? $data->id : null);

if (!empty($id) && isset($data->status)) {
    $database = new Database();
    $db = $database->getConnection();

    $query = "UPDATE subtasks SET status = :status WHERE id = :id";
    $stmt = $db->prepare($query);
    $status = htmlspecialchars(strip_tags($data->status));
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':id', $id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Subtask updated"]);
    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Unable to update subtask"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data"]);
}
?>
