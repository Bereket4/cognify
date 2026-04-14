<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

JWT::verifyAdmin();

$database = new Database();
$db = $database->getConnection();

// Overall Stats
$overall_q = "SELECT 
                (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
                (SELECT COUNT(*) FROM tasks) as total_tasks,
                (SELECT COUNT(*) FROM tasks WHERE status = 'completed') as completed_tasks,
                (SELECT COUNT(*) FROM tasks WHERE deadline < NOW() AND status != 'completed') as overdue_tasks";
$overall_s = $db->query($overall_q);
$overall_stats = $overall_s->fetch(PDO::FETCH_ASSOC);

// Student progress breakdown
$student_q = "SELECT u.id, u.name, 
                COUNT(t.id) as task_count,
                SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count
              FROM users u 
              LEFT JOIN tasks t ON u.id = t.user_id 
              WHERE u.role = 'student' 
              GROUP BY u.id";
$student_s = $db->query($student_q);
$student_progress = $student_s->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode([
    "status" => "success", 
    "data" => [
        "overall" => $overall_stats,
        "students" => $student_progress
    ]
]);
?>
