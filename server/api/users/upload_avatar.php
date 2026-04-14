<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

try {
    $user = JWT::verifyAuth();
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit();
}

if (!isset($_FILES['avatar'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing avatar file"]);
    exit();
}

$file = $_FILES['avatar'];
$database = new Database();
$db = $database->getConnection();

// Validate file type
$allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);

if (!in_array($mime, $allowedMimes)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid file type. Supported: JPG, PNG, GIF, WEBP"]);
    exit();
}

$uploadDir = '../../uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Generate unique name (always JPG for consistency and speed)
$uniqueName = 'avatar_' . $user['user_id'] . '_' . time() . '.jpg';
$targetPath = $uploadDir . $uniqueName;

// 1. Create image resource based on type (with GD)
$gdEnabled = extension_loaded('gd');
$img = null;

if ($gdEnabled) {
    try {
        switch ($mime) {
            case 'image/jpeg': $img = @imagecreatefromjpeg($file['tmp_name']); break;
            case 'image/png':  $img = @imagecreatefrompng($file['tmp_name']); break;
            case 'image/gif':  $img = @imagecreatefromgif($file['tmp_name']); break;
            case 'image/webp': $img = @imagecreatefromwebp($file['tmp_name']); break;
        }
    } catch (Exception $e) { $img = null; }
}

if ($gdEnabled && $img) {
    // 2. Resize maintaining aspect ratio (max 400px)
    $width = imagesx($img);
    $height = imagesy($img);
    $maxDim = 400;

    if ($width > $maxDim || $height > $maxDim) {
        $ratio = $width / $height;
        if ($ratio > 1) {
            $newWidth = $maxDim;
            $newHeight = $maxDim / $ratio;
        } else {
            $newWidth = $maxDim * $ratio;
            $newHeight = $maxDim;
        }
        $newImg = imagecreatetruecolor($newWidth, $newHeight);
        
        // Preserve transparency for PNG/GIF/WEBP before conversion to JPG (fill with white)
        $white = imagecolorallocate($newImg, 255, 255, 255);
        imagefill($newImg, 0, 0, $white);
        
        imagecopyresampled($newImg, $img, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        $success = imagejpeg($newImg, $targetPath, 85); 
        imagedestroy($newImg);
    } else {
        $newImg = imagecreatetruecolor($width, $height);
        $white = imagecolorallocate($newImg, 255, 255, 255);
        imagefill($newImg, 0, 0, $white);
        imagecopy($newImg, $img, 0, 0, 0, 0, $width, $height);
        $success = imagejpeg($newImg, $targetPath, 85);
        imagedestroy($newImg);
    }
    imagedestroy($img);
} else {
    // Fallback: Just move the file if GD is missing or fails (maintain original extension)
    $ext = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp'
    ][$mime];
    $uniqueName = 'avatar_' . $user['user_id'] . '_' . time() . '.' . $ext;
    $targetPath = $uploadDir . $uniqueName;
    $success = move_uploaded_file($file['tmp_name'], $targetPath);
}

if ($success) {
    $avatarUrl = 'server/uploads/' . $uniqueName;
    
    // Fetch old avatar to delete it
    $qOld = "SELECT avatarUrl FROM users WHERE id = :id";
    $sOld = $db->prepare($qOld);
    $sOld->bindParam(':id', $user['user_id']);
    $sOld->execute();
    $oldUrl = $sOld->fetchColumn();

    // Update database
    $query = "UPDATE users SET avatarUrl = :avatarUrl WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':avatarUrl', $avatarUrl);
    $stmt->bindParam(':id', $user['user_id']);

    if ($stmt->execute()) {
        // Delete old file if it exists and is in uploads
        if ($oldUrl && strpos($oldUrl, 'server/uploads/') !== false) {
            $oldFilePath = '../../' . str_replace('server/', '', $oldUrl);
            if (file_exists($oldFilePath)) @unlink($oldFilePath);
        }
        
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Avatar synchronized", "avatarUrl" => $avatarUrl]);
    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Database synchronization failed"]);
    }
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Optimization failed"]);
}
?>
