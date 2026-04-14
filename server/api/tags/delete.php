<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$user = JWT::verifyAuth();
$tag_id = isset($_GET['id']) ? $_GET['id'] : null;

if (!empty($tag_id)) {
    $database = new Database();
    $db = $database->getConnection();

    // Verify ownership
    $check_query = "SELECT id FROM tags WHERE id = :id AND user_id = :user_id";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(':id', $tag_id);
    $check_stmt->bindParam(':user_id', $user['user_id']);
    $check_stmt->execute();

    if ($check_stmt->rowCount() == 0) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Not authorized to delete this tag."]);
        exit();
    }

    $query = "DELETE FROM tags WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $tag_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Tag deleted successfully"]);
    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Unable to delete tag"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Tag ID is required."]);
}
?>
