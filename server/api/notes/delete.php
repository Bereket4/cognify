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
$note_id = isset($_GET['id']) ? $_GET['id'] : null;

if (!empty($note_id)) {
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
        echo json_encode(["status" => "error", "message" => "Not authorized to delete this note."]);
        exit();
    }

    $query = "DELETE FROM notes WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $note_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Note deleted successfully"]);
    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Unable to delete note"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Note ID is required."]);
}
?>
