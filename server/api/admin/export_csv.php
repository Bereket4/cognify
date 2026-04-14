<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

// Notice: In a real app we might pass JWT via query string for a direct download link, 
// but here we expect the React frontend to fetch it as a blob.
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$user = JWT::verifyAdmin();

$database = new Database();
$db = $database->getConnection();

$query = "SELECT t.id, u.name as student_name, t.title, t.status, t.priority, t.deadline, t.created_at 
          FROM tasks t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC";
$stmt = $db->prepare($query);
$stmt->execute();

$tasks = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $tasks[] = $row;
}

header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="system_tasks_export.csv"');
header('Pragma: no-cache');
header('Expires: 0');

$output = fopen('php://output', 'w');
fputcsv($output, array('TASK_ID', 'STUDENT_IDENTITY', 'OBJECTIVE_TITLE', 'PROTOCOL_STATUS', 'PRIORITY_LEVEL', 'RESOLUTION_DATE', 'SYNCHRONIZED_AT'));

foreach ($tasks as $task) {
    fputcsv($output, array(
        $task['id'],
        strtoupper($task['student_name']),
        $task['title'],
        strtoupper($task['status']),
        strtoupper($task['priority']),
        $task['deadline'] ? $task['deadline'] : 'N/A',
        $task['created_at']
    ));
}

fclose($output);
exit();
?>
