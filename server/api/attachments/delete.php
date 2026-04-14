<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$user = JWT::verifyAuth();
$id = isset($_GET['id']) ? $_GET['id'] : null;

if (!empty($id)) {
    $database = new Database();
    $db = $database->getConnection();

    $q = "SELECT filepath FROM attachments WHERE id = :id";
    $s = $db->prepare($q);
    $s->bindParam(':id', $id);
    $s->execute();
    $row = $s->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $fullPath = '../../../../../' . $row['filepath']; // adjust path logic
        // Because filepath is saved as 'server/uploads/xxx'
        $absPath = realpath(__DIR__ . '/../../../../' . $row['filepath']);
        if ($absPath && file_exists($absPath)) {
            unlink($absPath);
        }

        $query = "DELETE FROM attachments WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Attachment deleted"]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Attachment not found"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data"]);
}
?>
