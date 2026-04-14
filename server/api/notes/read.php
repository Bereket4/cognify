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

$database = new Database();
$db = $database->getConnection();

$project_id = isset($_GET['project_id']) ? $_GET['project_id'] : null;
$note_id = isset($_GET['id']) ? $_GET['id'] : null;
$type = isset($_GET['type']) ? $_GET['type'] : null;

if ($note_id) {
    // Read single note
    $query = "SELECT n.*, p.name as project_name FROM notes n LEFT JOIN projects p ON n.project_id = p.id WHERE n.id = :id AND n.user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $note_id);
    $stmt->bindParam(':user_id', $user['user_id']);
} else if ($type) {
    // Read all notes of specific type
    $query = "SELECT n.id, n.title, n.content, n.created_at, n.updated_at, p.name as project_name FROM notes n LEFT JOIN projects p ON n.project_id = p.id WHERE n.user_id = :user_id AND n.type = :type ORDER BY n.updated_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['user_id']);
    $stmt->bindParam(':type', $type);
} else if ($project_id) {
    // Read all notes in project
    $query = "SELECT id, title, created_at, updated_at FROM notes WHERE project_id = :project_id AND user_id = :user_id ORDER BY updated_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':project_id', $project_id);
    $stmt->bindParam(':user_id', $user['user_id']);
} else {
    // Read all user notes
    $query = "SELECT n.id, n.title, n.created_at, n.updated_at, p.name as project_name FROM notes n LEFT JOIN projects p ON n.project_id = p.id WHERE n.user_id = :user_id ORDER BY n.updated_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['user_id']);
}

$stmt->execute();

if ($note_id) {
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        http_response_code(200);
        echo json_encode(["status" => "success", "data" => $row]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Note not found"]);
    }
} else {
    $notes = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $notes[] = $row;
    }
    http_response_code(200);
    echo json_encode(["status" => "success", "data" => $notes]);
}
?>
