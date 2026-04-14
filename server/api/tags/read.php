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

$query = "SELECT id, name, color FROM tags WHERE user_id = :user_id ORDER BY name ASC";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $user['user_id']);
$stmt->execute();

$tags = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $tags[] = $row;
}

http_response_code(200);
echo json_encode(["status" => "success", "data" => $tags]);
?>
