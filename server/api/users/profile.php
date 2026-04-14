<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

$user = JWT::verifyAuth();
$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $q = "SELECT id, name, email, role, avatarUrl, created_at FROM users WHERE id = :id";
    $s = $db->prepare($q);
    $s->bindParam(':id', $user['user_id']);
    $s->execute();
    $d = $s->fetch(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "data" => $d]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->name)) {
        // If password is provided, update it. Else keep old
        if (!empty($data->password)) {
            $q = "UPDATE users SET name = :name, password = :pass WHERE id = :id";
            $s = $db->prepare($q);
            $hash = password_hash($data->password, PASSWORD_BCRYPT);
            $s->bindParam(':pass', $hash);
        } else {
            $q = "UPDATE users SET name = :name WHERE id = :id";
            $s = $db->prepare($q);
        }
        $name = htmlspecialchars(strip_tags($data->name));
        $s->bindParam(':name', $name);
        $s->bindParam(':id', $user['user_id']);

        if ($s->execute()) {
            echo json_encode(["status" => "success", "message" => "Profile updated"]);
        } else {
            http_response_code(503);
            echo json_encode(["status" => "error", "message" => "Unable to update profile"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Name is required"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
