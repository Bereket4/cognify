<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$admin = JWT::verifyAdmin();
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->student_id) && !empty($data->title)) {
    $database = new Database();
    $db = $database->getConnection();

    $query = "INSERT INTO tasks (user_id, title, description, priority, deadline) VALUES (:user_id, :title, :description, :priority, :deadline)";
    $stmt = $db->prepare($query);

    $title = htmlspecialchars(strip_tags($data->title));
    $description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : 'Assigned by Admin';
    $priority = isset($data->priority) ? htmlspecialchars(strip_tags($data->priority)) : 'medium';
    $deadline = isset($data->deadline) && !empty($data->deadline) ? htmlspecialchars(strip_tags($data->deadline)) : null;

    $stmt->bindParam(':user_id', $data->student_id);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':description', $description);
    $stmt->bindParam(':priority', $priority);
    $stmt->bindParam(':deadline', $deadline);

    if ($stmt->execute()) {
        // notify student
        $notif = "Admin assigned a new task: " . $title;
        $nq = "INSERT INTO notifications (user_id, message) VALUES (:uid, :msg)";
        $ns = $db->prepare($nq);
        $ns->bindParam(':uid', $data->student_id);
        $ns->bindParam(':msg', $notif);
        $ns->execute();

        http_response_code(201);
        echo json_encode(["status" => "success", "message" => "Task assigned to student"]);
    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Unable to align task"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data"]);
}
?>
