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

if (!isset($_POST['task_id']) || !isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing task_id or file"]);
    exit();
}

$task_id = $_POST['task_id'];
$file = $_FILES['file'];

$database = new Database();
$db = $database->getConnection();

// Basic security check on file extension
$allowedExts = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'zip'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!in_array($ext, $allowedExts)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid file type"]);
    exit();
}

$uploadDir = '../../uploads/';
// Create a unique filename
$uniqueName = uniqid() . '-' . basename($file['name']);
$targetPath = $uploadDir . $uniqueName;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $query = "INSERT INTO attachments (task_id, filename, filepath) VALUES (:task_id, :filename, :filepath)";
    $stmt = $db->prepare($query);
    
    $filename = htmlspecialchars(strip_tags($file['name']));
    // Save relative path for easy frontend retrieval
    $filepath = 'server/uploads/' . $uniqueName;
    
    $stmt->bindParam(':task_id', $task_id);
    $stmt->bindParam(':filename', $filename);
    $stmt->bindParam(':filepath', $filepath);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["status" => "success", "message" => "File uploaded", "attachment" => [
            "id" => $db->lastInsertId(),
            "filename" => $filename,
            "filepath" => $filepath
        ]]);
    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Database save failed"]);
    }
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Upload failed on server"]);
}
?>
