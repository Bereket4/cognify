<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

JWT::verifyAdmin(); // Verifies auth AND admin role

$database = new Database();
$db = $database->getConnection();

$query = "SELECT t.*, u.name as user_name FROM tasks t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC";
$stmt = $db->prepare($query);
$stmt->execute();

$tasks = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $tasks[] = $row;
}

http_response_code(200);
echo json_encode([
    "status" => "success",
    "data" => $tasks
]);
?>
