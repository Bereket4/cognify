<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$user = JWT::verifyAdmin();
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->action) && !empty($data->task_ids) && is_array($data->task_ids)) {
    $database = new Database();
    $db = $database->getConnection();
    
    $ids = implode(',', array_map('intval', $data->task_ids));
    $action = $data->action;

    if ($action === 'delete') {
        $q = "DELETE FROM tasks WHERE id IN ($ids)";
        $db->query($q);
    } elseif ($action === 'complete') {
        $q = "UPDATE tasks SET status = 'completed' WHERE id IN ($ids)";
        $db->query($q);
    } elseif ($action === 'extend_deadline' && !empty($data->new_deadline)) {
        $new_deadline = htmlspecialchars(strip_tags($data->new_deadline));
        $q = "UPDATE tasks SET deadline = :deadline WHERE id IN ($ids)";
        $s = $db->prepare($q);
        $s->bindParam(':deadline', $new_deadline);
        $s->execute();
    }

    // Add notifications to users whose tasks were bulk modified
    // Optional nice-to-have logic skipped for brevity, but query below gets owners:
    // SELECT DISTINCT user_id FROM tasks WHERE id IN ($ids) -> insert notification

    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Bulk action '$action' executed"]);
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data"]);
}
?>
