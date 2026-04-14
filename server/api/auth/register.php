<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->name) && !empty($data->email) && !empty($data->password)) {
    $database = new Database();
    $db = $database->getConnection();

    $query = "SELECT id FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $data->email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Email already exists."]);
        exit();
    }

    $query = "INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)";
    $stmt = $db->prepare($query);

    $name = htmlspecialchars(strip_tags($data->name));
    $email = htmlspecialchars(strip_tags($data->email));
    $password = password_hash($data->password, PASSWORD_BCRYPT);
    $role = isset($data->role) && $data->role === 'admin' ? 'admin' : 'student';

    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':password', $password);
    $stmt->bindParam(':role', $role);

    if ($stmt->execute()) {
        $user_id = $db->lastInsertId();
        
        // Initialize Default Tags
        $default_tags = [
            ['Critical', '#ef4444'],
            ['In Progress', '#6366f1'],
            ['Research', '#10b981'],
            ['Brainstorm', '#f59e0b'],
            ['Architecture', '#8b5cf6']
        ];
        
        $tag_q = "INSERT INTO tags (user_id, name, color) VALUES (:user_id, :name, :color)";
        $tag_s = $db->prepare($tag_q);
        foreach ($default_tags as $t) {
            $tag_s->bindParam(':user_id', $user_id);
            $tag_s->bindParam(':name', $t[0]);
            $tag_s->bindParam(':color', $t[1]);
            $tag_s->execute();
        }

        http_response_code(201);
        echo json_encode(["status" => "success", "message" => "User was registered."]);
    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Unable to register user."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data."]);
}
?>
