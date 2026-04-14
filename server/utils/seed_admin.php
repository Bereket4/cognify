<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$name = "admin";
$email = "admin@gmail.com";
$password = "admin123";
$hashed_password = password_hash($password, PASSWORD_BCRYPT);
$role = "admin";

// Check if exists
$check = $db->prepare("SELECT id FROM users WHERE email = :email");
$check->bindParam(':email', $email);
$check->execute();

if ($check->rowCount() > 0) {
    // Update existing to ensure role is admin
    $query = "UPDATE users SET name = :name, password = :password, role = :role WHERE email = :email";
    echo "Updating existing admin account...\n";
} else {
    $query = "INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)";
    echo "Creating new admin account...\n";
}

$stmt = $db->prepare($query);
$stmt->bindParam(':name', $name);
$stmt->bindParam(':email', $email);
$stmt->bindParam(':password', $hashed_password);
$stmt->bindParam(':role', $role);

if ($stmt->execute()) {
    echo "Admin account '$email' is now active with role '$role'.\n";
    echo "Password: $password\n";
} else {
    echo "Failed to create admin account.\n";
}
?>
