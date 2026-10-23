<?php
declare(strict_types=1);
require dirname(__DIR__) . '/src/bootstrap.php';

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$base = rtrim(env_value('API_BASE_PATH', '/api') ?? '/api', '/');
if ($base !== '' && str_starts_with($path, $base)) $path = substr($path, strlen($base));
$path = '/' . trim($path, '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($path === '/health' && $method === 'GET') json_response(['ok' => true, 'service' => 'ovc-content-api']);

    if ($path === '/admin/login' && $method === 'POST') {
        $body = request_json();
        $username = env_value('ADMIN_USERNAME');
        $passwordHash = env_value('ADMIN_PASSWORD_HASH');
        if (!$username || !$passwordHash || !hash_equals($username, (string)($body['username'] ?? '')) || !password_verify((string)($body['password'] ?? ''), $passwordHash)) {
            usleep(350000);
            json_response(['error' => 'Invalid username or password.'], 401);
        }
        session_regenerate_id(true);
        $_SESSION['admin_authenticated'] = true;
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        json_response(['ok' => true, 'csrfToken' => $_SESSION['csrf_token']]);
    }
    if ($path === '/admin/logout' && $method === 'POST') {
        require_admin(); require_csrf();
        $_SESSION = [];
        session_destroy();
        json_response(['ok' => true]);
    }
    if ($path === '/admin/csrf' && $method === 'GET') {
        require_admin();
        if (empty($_SESSION['csrf_token'])) $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        json_response(['csrfToken' => $_SESSION['csrf_token']]);
    }

    if ($path === '/content' && $method === 'GET') {
        $rows = db()->query('SELECT section_key, content_json, updated_at FROM site_sections ORDER BY section_key')->fetchAll();
        $content = [];
        foreach ($rows as $row) $content[$row['section_key']] = json_decode($row['content_json'], true);
        json_response(['sections' => $content]);
    }
    if ($path === '/contact' && $method === 'POST') {
        if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 8192) json_response(['error' => 'The request is too large.'], 413);
        $body = request_json();
        if (trim((string)($body['website'] ?? '')) !== '') json_response(['ok' => true], 202);
        $fields = [];
        foreach (['fullName' => 120, 'phone' => 40, 'email' => 254, 'service' => 120, 'location' => 160, 'description' => 3000] as $key => $max) {
            $raw = $body[$key] ?? null;
            if (!is_string($raw)) json_response(['error' => 'One or more fields have an invalid type.'], 422);
            $value = trim($raw);
            if (text_length($value) > $max) json_response(['error' => 'One or more fields exceed the allowed length.'], 422);
            $fields[$key] = $value;
        }
        $emailPattern = '/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/u';
        $validServices = ['Interior & Exterior Painting and Design', 'Wall Screeding', 'Paint Production', 'Wallpaper Installation', 'Maintenance', 'Sales of Paint', 'Stucco Finishing', 'General Construction', 'Site Supervision', 'Contracting', 'Project Management', 'Civil & Architectural Design', 'Structural Design'];
        $errors = [];
        if (text_length($fields['fullName']) < 2) $errors['fullName'] = 'Enter your full name.';
        if (text_length($fields['phone']) < 7) $errors['phone'] = 'Enter a phone number we can use to contact you.';
        if (!filter_var($fields['email'], FILTER_VALIDATE_EMAIL) || !preg_match($emailPattern, $fields['email'])) $errors['email'] = 'Enter a valid email address.';
        if (!in_array($fields['service'], $validServices, true)) $errors['service'] = 'Choose a valid service.';
        if (text_length($fields['location']) < 2) $errors['location'] = 'Enter the project location.';
        if (text_length($fields['description']) < 10) $errors['description'] = 'Describe the project in at least 10 characters.';
        if ($errors) json_response(['error' => 'Please review the enquiry details.', 'fields' => $errors], 422);
        $rateKey = env_value('RATE_LIMIT_HMAC_KEY');
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        if (!$rateKey || !filter_var($ip, FILTER_VALIDATE_IP)) json_response(['error' => 'The enquiry service is not configured. Please contact OVC by phone.'], 503);
        $ipHash = hash_hmac('sha256', $ip, $rateKey);
        $pdo = db();
        $rate = $pdo->prepare('SELECT COUNT(*) FROM contact_enquiries WHERE ip_hash = :ip AND created_at >= (NOW() - INTERVAL 15 MINUTE)');
        $rate->execute(['ip' => $ipHash]);
        if ((int)$rate->fetchColumn() >= 5) json_response(['error' => 'Too many enquiries were submitted from this connection. Please wait a little and try again, or call OVC.'], 429);
        $stmt = $pdo->prepare('INSERT INTO contact_enquiries (full_name, phone, email, service, location, description, ip_hash) VALUES (:name, :phone, :email, :service, :location, :description, :ip)');
        $stmt->execute(['name' => $fields['fullName'], 'phone' => $fields['phone'], 'email' => $fields['email'], 'service' => $fields['service'], 'location' => $fields['location'], 'description' => $fields['description'], 'ip' => $ipHash]);
        json_response(['ok' => true, 'id' => (int)$pdo->lastInsertId()], 201);
    }
    if ($path === '/admin/content' && $method === 'PUT') {
        require_admin(); require_csrf();
        $body = request_json();
        $key = trim((string)($body['key'] ?? ''));
        $data = $body['content'] ?? null;
        if (!preg_match('/^[a-z0-9_-]{1,80}$/', $key) || !is_array($data)) json_response(['error' => 'Provide a valid section key and content object.'], 422);
        $json = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($json === false || strlen($json) > 200000) json_response(['error' => 'Content is invalid or too large.'], 422);
        $stmt = db()->prepare('INSERT INTO site_sections (section_key, content_json) VALUES (:key, :content) ON DUPLICATE KEY UPDATE content_json = VALUES(content_json), updated_at = CURRENT_TIMESTAMP');
        $stmt->execute(['key' => $key, 'content' => $json]);
        json_response(['ok' => true, 'key' => $key]);
    }

    if ($path === '/media' && $method === 'GET') {
        $stmt = db()->query("SELECT id, filename, original_name, media_type, title, alt_text, created_at FROM media WHERE is_published = 1 ORDER BY sort_order, created_at DESC");
        $items = array_map(static function (array $row): array { $row['url'] = rtrim(env_value('PUBLIC_API_URL', ''), '/') . '/media/' . $row['id']; return $row; }, $stmt->fetchAll());
        json_response(['media' => $items]);
    }
    if ($path === '/admin/media' && $method === 'GET') {
        require_admin();
        $items = db()->query('SELECT id, filename, original_name, media_type, title, alt_text, is_published, sort_order, created_at FROM media ORDER BY sort_order, created_at DESC')->fetchAll();
        json_response(['media' => $items]);
    }
    if ($path === '/admin/enquiries' && $method === 'GET') {
        require_admin();
        $items = db()->query('SELECT id, full_name, phone, email, service, location, description, status, created_at FROM contact_enquiries ORDER BY created_at DESC LIMIT 200')->fetchAll();
        json_response(['enquiries' => $items]);
    }
    if ($path === '/admin/media' && $method === 'POST') {
        require_admin(); require_csrf();
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) json_response(['error' => 'A valid file upload is required.'], 422);
        $file = $_FILES['file'];
        $max = (int)(env_value('MAX_UPLOAD_BYTES', '104857600') ?? '104857600');
        if ($file['size'] > $max) json_response(['error' => 'File exceeds the configured upload size limit.'], 413);
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        $types = ['image/jpeg' => ['image', 'jpg'], 'image/png' => ['image', 'png'], 'image/webp' => ['image', 'webp'], 'image/gif' => ['image', 'gif'], 'video/mp4' => ['video', 'mp4'], 'video/webm' => ['video', 'webm'], 'video/quicktime' => ['video', 'mov']];
        if (!isset($types[$mime])) json_response(['error' => 'Only JPEG, PNG, WebP, GIF, MP4, WebM and MOV files are supported.'], 415);
        [$kind, $extension] = $types[$mime];
        $storage = rtrim(env_value('MEDIA_STORAGE_PATH', dirname(__DIR__) . '/storage/media') ?? '', '/');
        if (!is_dir($storage) && !mkdir($storage, 0750, true) && !is_dir($storage)) json_response(['error' => 'Media storage is unavailable.'], 500);
        $filename = bin2hex(random_bytes(20)) . '.' . $extension;
        if (!move_uploaded_file($file['tmp_name'], $storage . '/' . $filename)) json_response(['error' => 'Could not save uploaded file.'], 500);
        $title = mb_substr(trim((string)($_POST['title'] ?? '')), 0, 180);
        $alt = mb_substr(trim((string)($_POST['alt_text'] ?? '')), 0, 300);
        try {
            $stmt = db()->prepare('INSERT INTO media (filename, original_name, mime_type, media_type, title, alt_text) VALUES (:filename, :original, :mime, :type, :title, :alt)');
            $stmt->execute(['filename' => $filename, 'original' => mb_substr(basename((string)$file['name']), 0, 255), 'mime' => $mime, 'type' => $kind, 'title' => $title, 'alt' => $alt]);
        } catch (Throwable $e) { @unlink($storage . '/' . $filename); throw $e; }
        json_response(['ok' => true, 'id' => (int)db()->lastInsertId(), 'filename' => $filename], 201);
    }
    if (preg_match('#^/admin/media/(\d+)$#', $path, $match) && $method === 'DELETE') {
        require_admin(); require_csrf();
        $pdo = db(); $stmt = $pdo->prepare('SELECT filename FROM media WHERE id = :id'); $stmt->execute(['id' => (int)$match[1]]); $row = $stmt->fetch();
        if (!$row) json_response(['error' => 'Media item not found.'], 404);
        $pdo->prepare('DELETE FROM media WHERE id = :id')->execute(['id' => (int)$match[1]]);
        $storage = rtrim(env_value('MEDIA_STORAGE_PATH', dirname(__DIR__) . '/storage/media') ?? '', '/');
        @unlink($storage . '/' . basename($row['filename']));
        json_response(['ok' => true]);
    }
    if (preg_match('#^/media/(\d+)$#', $path, $match) && $method === 'GET') {
        $stmt = db()->prepare('SELECT filename, mime_type FROM media WHERE id = :id AND is_published = 1'); $stmt->execute(['id' => (int)$match[1]]); $row = $stmt->fetch();
        if (!$row) json_response(['error' => 'Media item not found.'], 404);
        $storage = rtrim(env_value('MEDIA_STORAGE_PATH', dirname(__DIR__) . '/storage/media') ?? '', '/');
        $file = $storage . '/' . basename($row['filename']);
        if (!is_file($file)) json_response(['error' => 'Media file is missing.'], 404);
        header('Content-Type: ' . $row['mime_type']); header('X-Content-Type-Options: nosniff'); header('Content-Length: ' . filesize($file)); header('Cache-Control: public, max-age=86400');
        readfile($file); exit;
    }
    json_response(['error' => 'Endpoint not found.'], 404);
} catch (PDOException $e) {
    error_log('OVC API database error: ' . $e->getMessage());
    json_response(['error' => 'A database operation failed. Check server configuration and logs.'], 500);
} catch (Throwable $e) {
    error_log('OVC API error: ' . $e->getMessage());
    json_response(['error' => 'An internal server error occurred.'], 500);
}
