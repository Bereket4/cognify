<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/jwt.php';

$auth = JWT::verifyAuth();
$userId = $auth['user_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];
$fileName = time() . '_' . basename($file['name']);
$targetDir = __DIR__ . '/../../uploads/chat/';
$targetFile = $targetDir . $fileName;
$fileType = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));

// Check file size (e.g., 20MB)
if ($file['size'] > 20000000) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'File too large (Max 20MB)']);
    exit;
}

if (move_uploaded_file($file['tmp_name'], $targetFile)) {
    echo json_encode([
        'status' => 'success', 
        'file_url' => 'server/uploads/chat/' . $fileName,
        'file_type' => $fileType
    ]);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Could not move uploaded file']);
}
?>
