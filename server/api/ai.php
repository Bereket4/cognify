<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../config/keys.php';

try {
    $user = JWT::verifyAuth();
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['prompt'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing prompt"]);
    exit();
}

$apiKey = GROQ_API_KEY;
$url = "https://api.groq.com/openai/v1/chat/completions";

$data = [
    "model" => "llama-3.1-8b-instant",
    "temperature" => 1,
    "max_completion_tokens" => 1024,
    "top_p" => 1,
    "stream" => false, // Set to false to avoid chunked-parsing crashes on the frontend
    "stop" => null,
    "messages" => [
        [
            "role" => "user",
            "content" => $input['prompt']
        ]
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if(curl_errno($ch)){
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => curl_error($ch)]);
} else if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode(["status" => "error", "message" => "AI Provider Error", "details" => json_decode($response)]);
} else {
    $decoded = json_decode($response, true);
    if(isset($decoded['choices'][0]['message']['content'])) {
        $text = $decoded['choices'][0]['message']['content'];
        echo json_encode(["status" => "success", "reply" => $text]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Invalid response format from AI"]);
    }
}
curl_close($ch);
?>
