<?php
try {
    $db = new PDO('mysql:host=localhost;dbname=school', 'root', '');
    $stmt = $db->query('SELECT id, name, email, role FROM users LIMIT 10');
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo $e->getMessage();
}
