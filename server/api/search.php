<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$user = JWT::verifyAuth();
$query_param = isset($_GET['q']) ? trim($_GET['q']) : '';

if (empty($query_param)) {
    echo json_encode(["status" => "success", "data" => []]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

$search_term = "%$query_param%";

// Search Tasks
$task_q = "SELECT id, title, 'task' as type FROM tasks WHERE user_id = :user_id AND (title LIKE :search OR description LIKE :search) LIMIT 10";
$t_stmt = $db->prepare($task_q);
$t_stmt->bindParam(':user_id', $user['user_id']);
$t_stmt->bindParam(':search', $search_term);
$t_stmt->execute();
$tasks = $t_stmt->fetchAll(PDO::FETCH_ASSOC);

// Search Notes
$note_q = "SELECT id, title, 'note' as type FROM notes WHERE user_id = :user_id AND (title LIKE :search OR content LIKE :search) LIMIT 10";
$n_stmt = $db->prepare($note_q);
$n_stmt->bindParam(':user_id', $user['user_id']);
$n_stmt->bindParam(':search', $search_term);
$n_stmt->execute();
$notes = $n_stmt->fetchAll(PDO::FETCH_ASSOC);

// Search Projects
$proj_q = "SELECT id, name as title, 'project' as type FROM projects WHERE user_id = :user_id AND (name LIKE :search OR description LIKE :search) LIMIT 10";
$p_stmt = $db->prepare($proj_q);
$p_stmt->bindParam(':user_id', $user['user_id']);
$p_stmt->bindParam(':search', $search_term);
$p_stmt->execute();
$projects = $p_stmt->fetchAll(PDO::FETCH_ASSOC);

$results = array_merge($tasks, $notes, $projects);

http_response_code(200);
echo json_encode(["status" => "success", "data" => $results]);
?>
