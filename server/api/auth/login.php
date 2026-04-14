<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    $database = new Database();
    $db = $database->getConnection();

    $query = "SELECT id, name, password, role, avatarUrl FROM users WHERE email = :email LIMIT 0,1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $data->email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (password_verify($data->password, $row['password'])) {
            $payload = [
                'user_id' => $row['id'],
                'name' => $row['name'],
                'role' => $row['role'],
                'exp' => time() + (60 * 60 * 24 * 7) // Valid for 7 days
            ];

            $jwt = JWT::encode($payload);

            http_response_code(200);
            echo json_encode([
                "status" => "success",
                "message" => "Login successful",
                "token" => $jwt,
                "user" => [
                    "id" => $row['id'],
                    "name" => $row['name'],
                    "role" => $row['role'],
                    "avatarUrl" => $row['avatarUrl']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Invalid password."]);
        }
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "User not found."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data."]);
}
?>
