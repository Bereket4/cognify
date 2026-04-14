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

$project_id = isset($_GET['project_id']) ? $_GET['project_id'] : null;

if ($project_id) {
    $query = "SELECT t.*, p.name as project_name FROM tasks t LEFT JOIN projects p ON t.project_id = p.id WHERE t.user_id = :user_id AND t.project_id = :project_id ORDER BY t.list_order ASC, t.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':project_id', $project_id);
} else {
    $query = "SELECT t.*, p.name as project_name FROM tasks t LEFT JOIN projects p ON t.project_id = p.id WHERE t.user_id = :user_id ORDER BY t.list_order ASC, t.created_at DESC";
    $stmt = $db->prepare($query);
}

$stmt->bindParam(':user_id', $user['user_id']);
$stmt->execute();

$tasks = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    // Subtasks
    $sub_q = "SELECT id, title, status FROM subtasks WHERE task_id = :task_id";
    $sub_s = $db->prepare($sub_q);
    $sub_s->bindParam(':task_id', $row['id']);
    $sub_s->execute();
    $row['subtasks'] = $sub_s->fetchAll(PDO::FETCH_ASSOC);
    
    // Comments
    $cmt_q = "SELECT c.id, c.comment, c.created_at, u.name as user_name FROM comments c JOIN users u ON c.user_id = u.id WHERE c.task_id = :task_id ORDER BY c.created_at ASC";
    $cmt_s = $db->prepare($cmt_q);
    $cmt_s->bindParam(':task_id', $row['id']);
    $cmt_s->execute();
    $row['comments'] = $cmt_s->fetchAll(PDO::FETCH_ASSOC);

    // Attachments
    $att_q = "SELECT id, filename, filepath FROM attachments WHERE task_id = :task_id";
    $att_s = $db->prepare($att_q);
    $att_s->bindParam(':task_id', $row['id']);
    $att_s->execute();
    $row['attachments'] = $att_s->fetchAll(PDO::FETCH_ASSOC);

    // Tags
    $tag_q = "SELECT tg.id, tg.name, tg.color FROM tags tg JOIN task_tags tt ON tg.id = tt.tag_id WHERE tt.task_id = :task_id";
    $tag_s = $db->prepare($tag_q);
    $tag_s->bindParam(':task_id', $row['id']);
    $tag_s->execute();
    $row['tags'] = $tag_s->fetchAll(PDO::FETCH_ASSOC);

    $tasks[] = $row;
}

http_response_code(200);
echo json_encode(["status" => "success", "data" => $tasks]);
?>
