<?php
require_once '../../config/cors.php';
require_once '../../utils/jwt.php';

// Ensure user is authenticated
try {
    $user = JWT::verifyAuth();
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit();
}

if (!isset($_GET['q']) || empty(trim($_GET['q']))) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Search query is required"]);
    exit();
}

$originalQuery = trim($_GET['q']);
// AI Enhancement: Add academic keywords to improve result quality
$enhancedQuery = $originalQuery . " academic science lecture university explanation";

function getYouTubeVideos($query) {
    $url = "https://www.youtube.com/results?search_query=" . urlencode($query);
    
    $options = [
        'http' => [
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36\r\n" .
                        "Accept-Language: en-US,en;q=0.9\r\n"
        ]
    ];
    $context = stream_context_create($options);
    $html = @file_get_contents($url, false, $context);

    if (!$html) return [];

    // Extract ytInitialData JSON from the page
    if (preg_match('/var ytInitialData = ({.*?});<\/script>/', $html, $matches)) {
        $json = json_decode($matches[1], true);
        $videos = [];
        
        try {
            $contents = $json['contents']['twoColumnBrowseResultsContextualHeaderRenderer'] 
                        ?? $json['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'];

            foreach ($contents as $item) {
                if (!isset($item['videoRenderer'])) continue;
                
                $v = $item['videoRenderer'];
                $videoId = $v['videoId'];
                $title = $v['title']['runs'][0]['text'] ?? 'Untitled';
                $thumbnail = $v['thumbnail']['thumbnails'][0]['url'] ?? '';
                $channel = $v['longBylineText']['runs'][0]['text'] ?? ($v['shortBylineText']['runs'][0]['text'] ?? 'Unknown');
                $description = $v['detailedMetadataSnippets'][0]['snippetText']['runs'][0]['text'] ?? 
                               ($v['descriptionSnippet']['runs'][0]['text'] ?? 'No description available for this academic resource.');
                
                $videos[] = [
                    'id' => $videoId,
                    'title' => $title,
                    'thumbnail' => $thumbnail,
                    'channel' => $channel,
                    'description' => substr($description, 0, 160) . '...',
                    'url' => "https://www.youtube.com/watch?v=" . $videoId
                ];

                if (count($videos) >= 12) break; // Limit results
            }
        } catch (Exception $e) {
            // Silently fail if structure changes, return what we have
        }
        
        return $videos;
    }

    return [];
}

$results = getYouTubeVideos($enhancedQuery);

// If enhanced query returns nothing, try original query
if (empty($results)) {
    $results = getYouTubeVideos($originalQuery);
}

http_response_code(200);
echo json_encode([
    "status" => "success", 
    "query" => $originalQuery,
    "data" => $results
]);
?>
