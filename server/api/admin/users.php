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

$query = "SELECT id, name, email, role, created_at FROM users";
$stmt = $db->prepare($query);
$stmt->execute();

$users = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $users[] = $row;
}

// Get total tasks across system for admin dashboard
$taskQuery = "SELECT COUNT(*) as total FROM tasks";
$taskStmt = $db->prepare($taskQuery);
$taskStmt->execute();
$taskRow = $taskStmt->fetch(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode([
    "status" => "success",
    "data" => [
        "users" => $users,
        "total_tasks" => (int)$taskRow['total']
    ]
]);
?>
