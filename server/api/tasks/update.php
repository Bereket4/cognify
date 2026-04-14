<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$user = JWT::verifyAuth();
$data = json_decode(file_get_contents("php://input"));
$task_id = isset($_GET['id']) ? $_GET['id'] : (isset($data->id) ? $data->id : null);

if (!empty($task_id) && !empty($data->title)) {
    $database = new Database();
    $db = $database->getConnection();

    try {
        $db->beginTransaction();

        // Verify ownership and fetch current status/priority for point delta calculation
        $check_query = "SELECT id, status, priority FROM tasks WHERE id = :id AND user_id = :user_id";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(':id', $task_id);
        $check_stmt->bindParam(':user_id', $user['user_id']);
        $check_stmt->execute();
        $oldTask = $check_stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$oldTask) {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Not authorized to update this task."]);
            exit();
        }

        $query = "UPDATE tasks SET project_id = :project_id, title = :title, description = :description, status = :status, priority = :priority, recurring_type = :recurring_type, deadline = :deadline, list_order = :list_order WHERE id = :id";
        $stmt = $db->prepare($query);

        $project_id = isset($data->project_id) ? $data->project_id : null;
        $title = htmlspecialchars(strip_tags($data->title));
        $description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : null;
        $status = isset($data->status) ? htmlspecialchars(strip_tags($data->status)) : 'pending';
        $priority = isset($data->priority) ? htmlspecialchars(strip_tags($data->priority)) : 'medium';
        $recurring_type = isset($data->recurring_type) ? htmlspecialchars(strip_tags($data->recurring_type)) : 'none';
        $deadline = isset($data->deadline) && !empty($data->deadline) ? htmlspecialchars(strip_tags($data->deadline)) : null;
        $list_order = isset($data->list_order) ? (int)$data->list_order : 0;

        $stmt->bindParam(':project_id', $project_id);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':priority', $priority);
        $stmt->bindParam(':recurring_type', $recurring_type);
        $stmt->bindParam(':deadline', $deadline);
        $stmt->bindParam(':list_order', $list_order);
        $stmt->bindParam(':id', $task_id);

        if ($stmt->execute()) {
            // Update Tags
            if (isset($data->tag_ids) && is_array($data->tag_ids)) {
                // Delete existing tags
                $del_q = "DELETE FROM task_tags WHERE task_id = :task_id";
                $del_s = $db->prepare($del_q);
                $del_s->bindParam(':task_id', $task_id);
                $del_s->execute();

                // Insert new ones
                $tag_query = "INSERT INTO task_tags (task_id, tag_id) VALUES (:task_id, :tag_id)";
                $tag_stmt = $db->prepare($tag_query);
                foreach ($data->tag_ids as $tag_id) {
                    $tag_stmt->bindParam(':task_id', $task_id);
                    $tag_stmt->bindParam(':tag_id', $tag_id);
                    $tag_stmt->execute();
                }
            }

            // Handle Study Streak & Achievement Points Logic
            if ($status === 'completed' && $oldTask['status'] !== 'completed') {
                $user_id = $user['user_id'];
                
                // 1. AWARD ACHIEVEMENT POINTS
                $points = 50; // Default medium
                if ($priority === 'high') $points = 100;
                if ($priority === 'low') $points = 25;
                
                $update_points_q = "UPDATE users SET achievement_points = achievement_points + :points WHERE id = :id";
                $point_stmt = $db->prepare($update_points_q);
                $point_stmt->bindParam(':points', $points);
                $point_stmt->bindParam(':id', $user_id);
                $point_stmt->execute();

                // 2. STREAK LOGIC
                // Fetch current streak data
                $streak_q = "SELECT streak_count, last_streak_update FROM users WHERE id = :id";
                $streak_stmt = $db->prepare($streak_q);
                $streak_stmt->bindParam(':id', $user_id);
                $streak_stmt->execute();
                $userData = $streak_stmt->fetch(PDO::FETCH_ASSOC);
                
                $today = date('Y-m-d');
                $yesterday = date('Y-m-d', strtotime('-1 day'));
                $lastUpdate = $userData['last_streak_update'];
                $currentStreak = (int)$userData['streak_count'];
                
                if ($lastUpdate !== $today) {
                    $newStreak = 1;
                    if ($lastUpdate === $yesterday) {
                        $newStreak = $currentStreak + 1;
                    }
                    
                    $update_streak_q = "UPDATE users SET streak_count = :streak, last_streak_update = :today WHERE id = :id";
                    $upd_stmt = $db->prepare($update_streak_q);
                    $upd_stmt->bindParam(':streak', $newStreak);
                    $upd_stmt->bindParam(':today', $today);
                    $upd_stmt->bindParam(':id', $user_id);
                    $upd_stmt->execute();
                }
            }

            $db->commit();
            http_response_code(200);
            echo json_encode(["status" => "success", "message" => "Task updated successfully."]);
        } else {
            $db->rollBack();
            http_response_code(503);
            echo json_encode(["status" => "error", "message" => "Unable to update task."]);
        }
    } catch (PDOException $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data. Task ID and title are required."]);
}
?>
