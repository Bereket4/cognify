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
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->task_id) && !empty($data->comment)) {
    $database = new Database();
    $db = $database->getConnection();

    $query = "INSERT INTO comments (task_id, user_id, comment) VALUES (:task_id, :user_id, :comment)";
    $stmt = $db->prepare($query);

    $comment = htmlspecialchars(strip_tags($data->comment));
    $stmt->bindParam(':task_id', $data->task_id);
    $stmt->bindParam(':user_id', $user['user_id']);
    $stmt->bindParam(':comment', $comment);

    if ($stmt->execute()) {
        $id = $db->lastInsertId();

        // Also fetch the created comment with user name to return instantly
        $cmt_query = "SELECT c.id, c.comment, c.created_at, u.name as user_name FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = :id";
        $cmt_stmt = $db->prepare($cmt_query);
        $cmt_stmt->bindParam(':id', $id);
        $cmt_stmt->execute();
        $cmt_row = $cmt_stmt->fetch(PDO::FETCH_ASSOC);

        http_response_code(201);
        echo json_encode(["status" => "success", "message" => "Comment added", "comment" => $cmt_row]);

        // Add Notification to task owner if it's admin commenting
        $task_query = "SELECT user_id FROM tasks WHERE id = :task_id";
        $tstmt = $db->prepare($task_query);
        $tstmt->bindParam(':task_id', $data->task_id);
        $tstmt->execute();
        $task_owner = $tstmt->fetch(PDO::FETCH_ASSOC);
        
        if ($task_owner && $task_owner['user_id'] != $user['user_id']) {
            $notif = "New comment on your task from " . $user['name'];
            $n_q = "INSERT INTO notifications (user_id, message) VALUES (:uid, :msg)";
            $nstmt = $db->prepare($n_q);
            $nstmt->bindParam(':uid', $task_owner['user_id']);
            $nstmt->bindParam(':msg', $notif);
            $nstmt->execute();
        }

    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Unable to add comment"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data"]);
}
?>
