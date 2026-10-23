<?php
declare(strict_types=1);

require dirname(__DIR__) . '/src/bootstrap.php';

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$base = '/' . trim((string)env_value('API_BASE_PATH', '/api'), '/');
if ($base !== '/' && ($path === $base || str_starts_with($path, $base . '/'))) $path = substr($path, strlen($base));
$path = '/' . trim($path, '/');
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

function page_params(): array {
    $limit = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT);
    $offset = filter_input(INPUT_GET, 'offset', FILTER_VALIDATE_INT);
    return ['limit' => max(1, min(100, $limit ?: 25)), 'offset' => max(0, min(1000000, $offset ?: 0))];
}

function safe_media_item(array $row): array {
    $row['id'] = (int)$row['id'];
    $row['is_published'] = (bool)$row['is_published'];
    $row['sort_order'] = (int)$row['sort_order'];
    $row['url'] = rtrim((string)env_value('PUBLIC_API_URL', ''), '/') . '/media/' . $row['id'];
    return $row;
}

function contact_services(): array {
    return ['Interior & Exterior Painting and Design', 'Wall Screeding', 'Paint Production', 'Wallpaper Installation', 'Maintenance', 'Sales of Paint', 'Stucco Finishing', 'General Construction', 'Site Supervision', 'Contracting', 'Project Management', 'Civil & Architectural Design', 'Structural Design'];
}

function clean_contact_payload(array $body): array {
    $limits = ['fullName' => 120, 'phone' => 40, 'email' => 254, 'service' => 120, 'location' => 160, 'description' => 3000];
    $values = [];
    $errors = [];
    foreach ($limits as $field => $max) {
        $value = $body[$field] ?? null;
        if (!is_string($value)) { $errors[$field] = 'This field must be text.'; continue; }
        $value = trim($value);
        if (text_length($value) > $max) { $errors[$field] = 'This field is too long.'; continue; }
        $values[$field] = $value;
    }
    if ($errors) json_response(['error' => 'Please review the fields marked below.', 'fields' => $errors], 422);
    if (text_length($values['fullName']) < 2) $errors['fullName'] = 'Enter your full name (at least 2 characters).';
    if (text_length($values['phone']) < 7) $errors['phone'] = 'Enter a phone number we can use to contact you.';
    if (!filter_var($values['email'], FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Enter a valid email address.';
    if (!in_array($values['service'], contact_services(), true)) $errors['service'] = 'Choose a listed service.';
    if (text_length($values['location']) < 2) $errors['location'] = 'Enter the project location.';
    if (text_length($values['description']) < 10) $errors['description'] = 'Describe the project in at least 10 characters.';
    if ($errors) json_response(['error' => 'Please review the fields marked below.', 'fields' => $errors], 422);
    return $values;
}

function handle_health(): never {
    $checks = ['php' => true, 'database' => false, 'schema' => false];
    $status = 200;
    try {
        $pdo = db();
        $checks['database'] = (bool)$pdo->query('SELECT 1')->fetchColumn();
        $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
        $required = ['site_sections', 'media', 'projects', 'contact_enquiries'];
        $checks['schema'] = count(array_diff($required, $tables)) === 0;
    } catch (Throwable $e) {
        error_log('OVC health check failed: ' . $e->getMessage());
        $status = 503;
    }
    $checks['ready'] = $checks['database'] && $checks['schema'];
    json_response(['ok' => $checks['ready'], 'service' => 'ovc-content-api', 'checks' => $checks, 'time' => gmdate(DATE_ATOM)], $status);
}

function handle_public_content(?string $key): never {
    $pdo = db();
    if ($key !== null) {
        if (!preg_match('/^[a-z0-9_-]{1,80}$/', $key)) json_response(['error' => 'Invalid section key.'], 400);
        $stmt = $pdo->prepare('SELECT section_key, content_json, updated_at FROM site_sections WHERE section_key = :key');
        $stmt->execute(['key' => $key]);
        $row = $stmt->fetch();
        if (!$row) json_response(['error' => 'Content section not found.'], 404);
        json_response(['key' => $row['section_key'], 'content' => json_decode($row['content_json'], true), 'updatedAt' => $row['updated_at']]);
    }
    $rows = $pdo->query('SELECT section_key, content_json, updated_at FROM site_sections ORDER BY section_key')->fetchAll();
    $sections = []; $updatedAt = [];
    foreach ($rows as $row) { $sections[$row['section_key']] = json_decode($row['content_json'], true); $updatedAt[$row['section_key']] = $row['updated_at']; }
    json_response(['sections' => $sections, 'updatedAt' => $updatedAt]);
}

function handle_contact(): never {
    $body = request_json(8192);
    // Respond identically for filled honeypots without storing their payload.
    if (trim((string)($body['website'] ?? '')) !== '') json_response(['ok' => true, 'message' => 'Enquiry received.'], 202);
    $values = clean_contact_payload($body);
    $rateKey = env_value('RATE_LIMIT_HMAC_KEY');
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!$rateKey || strlen($rateKey) < 32 || !filter_var($ip, FILTER_VALIDATE_IP)) json_response(['error' => 'The enquiry service is not configured. Please contact OVC by phone.'], 503);
    $ipHash = hash_hmac('sha256', $ip, $rateKey);
    $pdo = db();
    $rate = $pdo->prepare('SELECT COUNT(*) FROM contact_enquiries WHERE ip_hash = :ip AND created_at >= (NOW() - INTERVAL 15 MINUTE)');
    $rate->execute(['ip' => $ipHash]);
    if ((int)$rate->fetchColumn() >= 5) json_response(['error' => 'Too many enquiries were submitted from this connection. Please wait 15 minutes or call OVC.'], 429);
    $stmt = $pdo->prepare('INSERT INTO contact_enquiries (full_name, phone, email, service, location, description, ip_hash) VALUES (:name, :phone, :email, :service, :location, :description, :ip)');
    $stmt->execute(['name' => $values['fullName'], 'phone' => $values['phone'], 'email' => $values['email'], 'service' => $values['service'], 'location' => $values['location'], 'description' => $values['description'], 'ip' => $ipHash]);
    json_response(['ok' => true, 'id' => (int)$pdo->lastInsertId(), 'message' => 'Enquiry received.'], 201);
}

/** Authenticate the single configured administrator; deliberately no users-table lookup or database query. */
function handle_login(): never {
    $body = request_json(4096);
    $username = env_value('ADMIN_USERNAME');
    $passwordHash = env_value('ADMIN_PASSWORD_HASH');
    $attempts = (int)($_SESSION['login_attempts'] ?? 0);
    $attemptStart = (int)($_SESSION['login_attempt_started'] ?? time());
    if (time() - $attemptStart > 900) { $attempts = 0; $attemptStart = time(); }
    if ($attempts >= 8) json_response(['error' => 'Too many sign-in attempts. Wait 15 minutes and try again.'], 429);
    if (!$username || !$passwordHash || !hash_equals($username, (string)($body['username'] ?? '')) || !password_verify((string)($body['password'] ?? ''), $passwordHash)) {
        $_SESSION['login_attempts'] = $attempts + 1; $_SESSION['login_attempt_started'] = $attemptStart; usleep(350000);
        json_response(['error' => 'Invalid username or password.'], 401);
    }
    session_regenerate_id(true);
    $_SESSION = ['admin_authenticated' => true, 'login_attempts' => 0, 'csrf_token' => bin2hex(random_bytes(32))];
    json_response(['ok' => true, 'username' => $username, 'csrfToken' => $_SESSION['csrf_token'], 'expires' => 'browser-session']);
}

function handle_content_save(): never {
    require_admin(); require_csrf();
    $body = request_json(220000);
    $key = trim((string)($body['key'] ?? ''));
    $data = $body['content'] ?? null;
    if (!preg_match('/^[a-z0-9_-]{1,80}$/', $key) || !is_array($data)) json_response(['error' => 'Provide a valid section key and content object.'], 422);
    $json = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false || strlen($json) > 200000) json_response(['error' => 'Content is invalid or too large.'], 422);
    $stmt = db()->prepare('INSERT INTO site_sections (section_key, content_json) VALUES (:key, :content) ON DUPLICATE KEY UPDATE content_json = VALUES(content_json), updated_at = CURRENT_TIMESTAMP');
    $stmt->execute(['key' => $key, 'content' => $json]);
    json_response(['ok' => true, 'key' => $key, 'updatedAt' => gmdate(DATE_ATOM)]);
}

function handle_media_list(bool $admin): never {
    if ($admin) require_admin();
    $page = page_params();
    $where = $admin ? '1=1' : 'is_published = 1';
    $type = $_GET['type'] ?? '';
    if ($type !== '' && !in_array($type, ['image', 'video'], true)) json_response(['error' => 'type must be image or video.'], 400);
    if ($type !== '') $where .= ' AND media_type = ' . db()->quote($type);
    $pdo = db();
    $count = (int)$pdo->query("SELECT COUNT(*) FROM media WHERE {$where}")->fetchColumn();
    $stmt = $pdo->prepare("SELECT id, filename, original_name, media_type, title, alt_text, is_published, sort_order, created_at, updated_at FROM media WHERE {$where} ORDER BY sort_order ASC, created_at DESC LIMIT :limit OFFSET :offset");
    $stmt->bindValue('limit', $page['limit'], PDO::PARAM_INT); $stmt->bindValue('offset', $page['offset'], PDO::PARAM_INT); $stmt->execute();
    $items = array_map('safe_media_item', $stmt->fetchAll());
    json_response(['media' => $items, 'pagination' => ['limit' => $page['limit'], 'offset' => $page['offset'], 'total' => $count, 'hasMore' => $page['offset'] + count($items) < $count]]);
}

function handle_media_upload(): never {
    require_admin(); require_csrf();
    if (!isset($_FILES['file'])) json_response(['error' => 'Multipart field "file" is required.'], 422);
    $file = $_FILES['file'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $messages = [UPLOAD_ERR_INI_SIZE => 'File exceeds PHP upload_max_filesize.', UPLOAD_ERR_FORM_SIZE => 'File exceeds the form size limit.', UPLOAD_ERR_PARTIAL => 'Upload was interrupted.', UPLOAD_ERR_NO_FILE => 'Choose an image or video file.', UPLOAD_ERR_NO_TMP_DIR => 'Server upload temporary directory is missing.', UPLOAD_ERR_CANT_WRITE => 'Server could not write the upload.', UPLOAD_ERR_EXTENSION => 'A server extension blocked the upload.'];
        json_response(['error' => $messages[$file['error']] ?? 'Upload failed.'], 422);
    }
    $max = (int)env_value('MAX_UPLOAD_BYTES', '104857600');
    if ($file['size'] <= 0 || $file['size'] > $max) json_response(['error' => 'File is empty or exceeds MAX_UPLOAD_BYTES.'], 413);
    if (!is_uploaded_file($file['tmp_name'])) json_response(['error' => 'Upload verification failed.'], 422);
    $finfo = new finfo(FILEINFO_MIME_TYPE); $mime = $finfo->file($file['tmp_name']);
    $types = ['image/jpeg' => ['image', 'jpg'], 'image/png' => ['image', 'png'], 'image/webp' => ['image', 'webp'], 'image/gif' => ['image', 'gif'], 'video/mp4' => ['video', 'mp4'], 'video/webm' => ['video', 'webm'], 'video/quicktime' => ['video', 'mov']];
    if (!isset($types[$mime])) json_response(['error' => 'Unsupported file type. Allowed: JPEG, PNG, WebP, GIF, MP4, WebM and MOV.'], 415);
    if (str_starts_with($mime, 'image/') && @getimagesize($file['tmp_name']) === false) json_response(['error' => 'The uploaded image data is invalid.'], 415);
    [$kind, $extension] = $types[$mime];
    $storage = rtrim((string)env_value('MEDIA_STORAGE_PATH', dirname(__DIR__) . '/storage/media'), '/');
    if (!is_dir($storage) && !mkdir($storage, 0750, true) && !is_dir($storage)) json_response(['error' => 'Media storage is unavailable.'], 500);
    $filename = bin2hex(random_bytes(20)) . '.' . $extension;
    if (!move_uploaded_file($file['tmp_name'], $storage . '/' . $filename)) json_response(['error' => 'Could not save uploaded file.'], 500);
    $title = text_slice(trim((string)($_POST['title'] ?? '')), 180);
    $alt = text_slice(trim((string)($_POST['alt_text'] ?? '')), 300);
    try {
        $stmt = db()->prepare('INSERT INTO media (filename, original_name, mime_type, media_type, title, alt_text) VALUES (:filename, :original, :mime, :type, :title, :alt)');
        $stmt->execute(['filename' => $filename, 'original' => text_slice(basename((string)$file['name']), 255), 'mime' => $mime, 'type' => $kind, 'title' => $title, 'alt' => $alt]);
    } catch (Throwable $e) { @unlink($storage . '/' . $filename); throw $e; }
    $id = (int)db()->lastInsertId();
    json_response(['ok' => true, 'media' => ['id' => $id, 'filename' => $filename, 'mediaType' => $kind, 'url' => rtrim((string)env_value('PUBLIC_API_URL', ''), '/') . '/media/' . $id]], 201);
}

function handle_media_update(int $id): never {
    require_admin(); require_csrf();
    $body = request_json(8192); $sets = []; $params = ['id' => $id];
    foreach (['title' => 180, 'alt_text' => 300] as $field => $max) {
        if (array_key_exists($field, $body)) { if (!is_string($body[$field])) json_response(['error' => "{$field} must be text."], 422); $sets[] = "{$field} = :{$field}"; $params[$field] = text_slice(trim($body[$field]), $max); }
    }
    if (array_key_exists('is_published', $body)) { if (!is_bool($body['is_published']) && !in_array($body['is_published'], [0, 1], true)) json_response(['error' => 'is_published must be true or false.'], 422); $sets[] = 'is_published = :published'; $params['published'] = (int)(bool)$body['is_published']; }
    if (array_key_exists('sort_order', $body)) { if (!is_int($body['sort_order']) || abs($body['sort_order']) > 1000000) json_response(['error' => 'sort_order must be an integer within ±1000000.'], 422); $sets[] = 'sort_order = :sort_order'; $params['sort_order'] = $body['sort_order']; }
    if (!$sets) json_response(['error' => 'Provide at least one editable media property.'], 422);
    $stmt = db()->prepare('UPDATE media SET ' . implode(', ', $sets) . ', updated_at = CURRENT_TIMESTAMP WHERE id = :id');
    $stmt->execute($params);
    if ($stmt->rowCount() === 0) { $check = db()->prepare('SELECT id FROM media WHERE id = :id'); $check->execute(['id' => $id]); if (!$check->fetch()) json_response(['error' => 'Media item not found.'], 404); }
    json_response(['ok' => true, 'id' => $id]);
}

function handle_media_delete(int $id): never {
    require_admin(); require_csrf();
    $pdo = db(); $stmt = $pdo->prepare('SELECT filename FROM media WHERE id = :id'); $stmt->execute(['id' => $id]); $row = $stmt->fetch();
    if (!$row) json_response(['error' => 'Media item not found.'], 404);
    $pdo->prepare('DELETE FROM media WHERE id = :id')->execute(['id' => $id]);
    $storage = rtrim((string)env_value('MEDIA_STORAGE_PATH', dirname(__DIR__) . '/storage/media'), '/');
    $file = $storage . '/' . basename($row['filename']);
    if (is_file($file) && !@unlink($file)) error_log('OVC media file cleanup failed for id ' . $id);
    json_response(['ok' => true, 'id' => $id]);
}

function handle_enquiries_list(): never {
    require_admin();
    $page = page_params(); $params = []; $where = '1=1';
    $status = $_GET['status'] ?? '';
    if ($status !== '') { if (!in_array($status, ['new', 'contacted', 'closed'], true)) json_response(['error' => 'status must be new, contacted or closed.'], 400); $where = 'status = :status'; $params['status'] = $status; }
    $pdo = db(); $countStmt = $pdo->prepare("SELECT COUNT(*) FROM contact_enquiries WHERE {$where}"); $countStmt->execute($params); $total = (int)$countStmt->fetchColumn();
    $stmt = $pdo->prepare("SELECT id, full_name, phone, email, service, location, description, status, internal_note, created_at, updated_at FROM contact_enquiries WHERE {$where} ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
    foreach ($params as $key => $value) $stmt->bindValue($key, $value); $stmt->bindValue('limit', $page['limit'], PDO::PARAM_INT); $stmt->bindValue('offset', $page['offset'], PDO::PARAM_INT); $stmt->execute();
    $items = $stmt->fetchAll(); foreach ($items as &$item) $item['id'] = (int)$item['id']; unset($item);
    json_response(['enquiries' => $items, 'pagination' => ['limit' => $page['limit'], 'offset' => $page['offset'], 'total' => $total, 'hasMore' => $page['offset'] + count($items) < $total]]);
}

function handle_enquiry_update(int $id): never {
    require_admin(); require_csrf();
    $body = request_json(8192); $sets = []; $params = ['id' => $id];
    if (array_key_exists('status', $body)) { if (!in_array($body['status'], ['new', 'contacted', 'closed'], true)) json_response(['error' => 'status must be new, contacted or closed.'], 422); $sets[] = 'status = :status'; $params['status'] = $body['status']; }
    if (array_key_exists('internal_note', $body)) { if (!is_string($body['internal_note']) || text_length($body['internal_note']) > 2000) json_response(['error' => 'internal_note must be text up to 2000 characters.'], 422); $sets[] = 'internal_note = :internal_note'; $params['internal_note'] = trim($body['internal_note']); }
    if (!$sets) json_response(['error' => 'Provide status and/or internal_note.'], 422);
    $stmt = db()->prepare('UPDATE contact_enquiries SET ' . implode(', ', $sets) . ', updated_at = CURRENT_TIMESTAMP WHERE id = :id'); $stmt->execute($params);
    if ($stmt->rowCount() === 0) { $check = db()->prepare('SELECT id FROM contact_enquiries WHERE id = :id'); $check->execute(['id' => $id]); if (!$check->fetch()) json_response(['error' => 'Enquiry not found.'], 404); }
    json_response(['ok' => true, 'id' => $id]);
}

function handle_enquiry_delete(int $id): never {
    require_admin(); require_csrf();
    $stmt = db()->prepare('DELETE FROM contact_enquiries WHERE id = :id'); $stmt->execute(['id' => $id]);
    if (!$stmt->rowCount()) json_response(['error' => 'Enquiry not found.'], 404);
    json_response(['ok' => true, 'id' => $id]);
}


function project_fields(array $body, bool $partial): array {
    $fields = [];
    foreach (['slug' => 120, 'title' => 180, 'summary' => 500, 'description' => 12000, 'category' => 120] as $field => $max) {
        if ($partial && !array_key_exists($field, $body)) continue;
        $value = $body[$field] ?? (in_array($field, ['summary', 'category'], true) ? '' : null);
        if (!is_string($value)) json_response(['error' => "{$field} must be text."], 422);
        $value = trim($value); if ($field === 'slug') $value = strtolower($value);
        if (text_length($value) > $max) json_response(['error' => "{$field} exceeds {$max} characters."], 422);
        if ($field === 'slug' && !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $value)) json_response(['error' => 'slug must use lowercase letters, numbers and single hyphens.'], 422);
        if (in_array($field, ['title', 'description'], true) && $value === '') json_response(['error' => "{$field} is required."], 422);
        $fields[$field] = $value;
    }
    if (!$partial && (!isset($fields['slug'], $fields['title'], $fields['description']))) json_response(['error' => 'slug, title and description are required.'], 422);
    if (array_key_exists('cover_media_id', $body)) {
        $cover = $body['cover_media_id'];
        if ($cover !== null && (!is_int($cover) || $cover < 1)) json_response(['error' => 'cover_media_id must be a positive media id or null.'], 422);
        if ($cover !== null) { $check = db()->prepare("SELECT id FROM media WHERE id = :id AND media_type = 'image'"); $check->execute(['id' => $cover]); if (!$check->fetch()) json_response(['error' => 'cover_media_id must reference an existing image.'], 422); }
        $fields['cover_media_id'] = $cover;
    } elseif (!$partial) $fields['cover_media_id'] = null;
    if (array_key_exists('status', $body)) { if (!in_array($body['status'], ['draft', 'published'], true)) json_response(['error' => 'status must be draft or published.'], 422); $fields['status'] = $body['status']; }
    elseif (!$partial) $fields['status'] = 'draft';
    if (array_key_exists('sort_order', $body)) { if (!is_int($body['sort_order']) || abs($body['sort_order']) > 1000000) json_response(['error' => 'sort_order must be an integer within ±1000000.'], 422); $fields['sort_order'] = $body['sort_order']; }
    elseif (!$partial) $fields['sort_order'] = 0;
    return $fields;
}

function handle_projects_list(bool $admin): never {
    if ($admin) require_admin();
    $page = page_params(); $where = $admin ? '1=1' : "p.status = 'published'";
    if ($admin && isset($_GET['status']) && $_GET['status'] !== '') { if (!in_array($_GET['status'], ['draft', 'published'], true)) json_response(['error' => 'status must be draft or published.'], 400); $where .= ' AND p.status = ' . db()->quote($_GET['status']); }
    $pdo = db(); $total = (int)$pdo->query("SELECT COUNT(*) FROM projects p WHERE {$where}")->fetchColumn();
    $sql = "SELECT p.id, p.slug, p.title, p.summary, p.description, p.category, p.cover_media_id, p.status, p.sort_order, p.created_at, p.updated_at, m.id AS joined_media_id, m.alt_text AS cover_alt_text FROM projects p LEFT JOIN media m ON m.id = p.cover_media_id AND m.is_published = 1 WHERE {$where} ORDER BY p.sort_order ASC, p.created_at DESC LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql); $stmt->bindValue('limit', $page['limit'], PDO::PARAM_INT); $stmt->bindValue('offset', $page['offset'], PDO::PARAM_INT); $stmt->execute(); $items = $stmt->fetchAll();
    foreach ($items as &$item) { $item['id'] = (int)$item['id']; $item['cover_media_id'] = $item['cover_media_id'] === null ? null : (int)$item['cover_media_id']; $item['sort_order'] = (int)$item['sort_order']; $item['cover_url'] = $item['joined_media_id'] ? rtrim((string)env_value('PUBLIC_API_URL', ''), '/') . '/media/' . $item['joined_media_id'] : null; unset($item['joined_media_id']); if (!$admin) { unset($item['status'], $item['sort_order'], $item['cover_media_id']); } }
    unset($item);
    json_response(['projects' => $items, 'pagination' => ['limit' => $page['limit'], 'offset' => $page['offset'], 'total' => $total, 'hasMore' => $page['offset'] + count($items) < $total]]);
}

function handle_project_detail(string $slug): never {
    $stmt = db()->prepare("SELECT p.id, p.slug, p.title, p.summary, p.description, p.category, p.created_at, p.updated_at, m.id AS media_id, m.alt_text AS cover_alt_text FROM projects p LEFT JOIN media m ON m.id = p.cover_media_id AND m.is_published = 1 WHERE p.slug = :slug AND p.status = 'published'");
    $stmt->execute(['slug' => $slug]); $item = $stmt->fetch(); if (!$item) json_response(['error' => 'Project not found.'], 404);
    $item['id'] = (int)$item['id']; $item['cover_url'] = $item['media_id'] ? rtrim((string)env_value('PUBLIC_API_URL', ''), '/') . '/media/' . $item['media_id'] : null; unset($item['media_id']);
    json_response(['project' => $item]);
}

function handle_admin_project_detail(int $id): never {
    require_admin();
    $stmt = db()->prepare('SELECT id, slug, title, summary, description, category, cover_media_id, status, sort_order, created_at, updated_at FROM projects WHERE id = :id');
    $stmt->execute(['id' => $id]); $item = $stmt->fetch();
    if (!$item) json_response(['error' => 'Project not found.'], 404);
    $item['id'] = (int)$item['id']; $item['cover_media_id'] = $item['cover_media_id'] === null ? null : (int)$item['cover_media_id']; $item['sort_order'] = (int)$item['sort_order'];
    json_response(['project' => $item]);
}

function handle_project_create(): never {
    require_admin(); require_csrf(); $fields = project_fields(request_json(24000), false);
    $stmt = db()->prepare('INSERT INTO projects (slug, title, summary, description, category, cover_media_id, status, sort_order) VALUES (:slug, :title, :summary, :description, :category, :cover_media_id, :status, :sort_order)');
    try { $stmt->execute($fields); } catch (PDOException $e) { if ((string)$e->getCode() === '23000') json_response(['error' => 'A project with this slug already exists.'], 409); throw $e; }
    json_response(['ok' => true, 'id' => (int)db()->lastInsertId(), 'slug' => $fields['slug']], 201);
}

function handle_project_update(int $id): never {
    require_admin(); require_csrf(); $fields = project_fields(request_json(24000), true);
    if (!$fields) json_response(['error' => 'Provide at least one project field to update.'], 422);
    $sets = []; foreach (array_keys($fields) as $field) $sets[] = "{$field} = :{$field}";
    $stmt = db()->prepare('UPDATE projects SET ' . implode(', ', $sets) . ', updated_at = CURRENT_TIMESTAMP WHERE id = :id'); $fields['id'] = $id;
    try { $stmt->execute($fields); } catch (PDOException $e) { if ((string)$e->getCode() === '23000') json_response(['error' => 'A project with this slug already exists.'], 409); throw $e; }
    if ($stmt->rowCount() === 0) { $check = db()->prepare('SELECT id FROM projects WHERE id = :id'); $check->execute(['id' => $id]); if (!$check->fetch()) json_response(['error' => 'Project not found.'], 404); }
    json_response(['ok' => true, 'id' => $id]);
}

function handle_project_delete(int $id): never {
    require_admin(); require_csrf(); $stmt = db()->prepare('DELETE FROM projects WHERE id = :id'); $stmt->execute(['id' => $id]);
    if (!$stmt->rowCount()) json_response(['error' => 'Project not found.'], 404);
    json_response(['ok' => true, 'id' => $id]);
}

try {
    if ($path === '/health' && $method === 'GET') handle_health();
    if ($path === '/admin/login' && $method === 'POST') handle_login();
    if ($path === '/admin/session' && $method === 'GET') { require_admin(); json_response(['authenticated' => true, 'username' => env_value('ADMIN_USERNAME'), 'csrfToken' => $_SESSION['csrf_token'] ?? null]); }
    if ($path === '/admin/csrf' && $method === 'GET') { require_admin(); if (empty($_SESSION['csrf_token'])) $_SESSION['csrf_token'] = bin2hex(random_bytes(32)); json_response(['csrfToken' => $_SESSION['csrf_token']]); }
    if ($path === '/admin/logout' && $method === 'POST') { require_admin(); require_csrf(); $_SESSION = []; if (ini_get('session.use_cookies')) { $params = session_get_cookie_params(); setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']); } session_destroy(); json_response(['ok' => true]); }

    if ($method === 'GET' && $path === '/content') handle_public_content(null);
    if ($method === 'GET' && preg_match('#^/content/([a-z0-9_-]{1,80})$#', $path, $match)) handle_public_content($match[1]);
    if ($method === 'POST' && $path === '/contact') handle_contact();
    if ($method === 'PUT' && $path === '/admin/content') handle_content_save();

    if ($method === 'GET' && $path === '/media') handle_media_list(false);
    if ($method === 'GET' && $path === '/admin/media') handle_media_list(true);
    if ($method === 'POST' && $path === '/admin/media') handle_media_upload();
    if (preg_match('#^/admin/media/(\d+)$#', $path, $match)) {
        $id = (int)$match[1];
        if ($method === 'PATCH') handle_media_update($id);
        if ($method === 'DELETE') handle_media_delete($id);
    }
    if ($method === 'GET' && preg_match('#^/media/(\d+)$#', $path, $match)) {
        $stmt = db()->prepare('SELECT filename, mime_type FROM media WHERE id = :id AND is_published = 1'); $stmt->execute(['id' => (int)$match[1]]); $row = $stmt->fetch();
        if (!$row) json_response(['error' => 'Media item not found.'], 404);
        $storage = rtrim((string)env_value('MEDIA_STORAGE_PATH', dirname(__DIR__) . '/storage/media'), '/'); $file = $storage . '/' . basename($row['filename']);
        if (!is_file($file)) json_response(['error' => 'Media file is missing.'], 404);
        header('Content-Type: ' . $row['mime_type']); header('X-Content-Type-Options: nosniff'); header('Content-Length: ' . filesize($file)); header('Cache-Control: public, max-age=86400, immutable'); readfile($file); exit;
    }
    if ($method === 'GET' && $path === '/projects') handle_projects_list(false);
    if ($method === 'GET' && $path === '/admin/projects') handle_projects_list(true);
    if ($method === 'POST' && $path === '/admin/projects') handle_project_create();
    if (preg_match('#^/admin/projects/(\d+)$#', $path, $match)) { $id = (int)$match[1]; if ($method === 'GET') handle_admin_project_detail($id); if ($method === 'PATCH') handle_project_update($id); if ($method === 'DELETE') handle_project_delete($id); }
    if ($method === 'GET' && preg_match('#^/projects/([a-z0-9-]+)$#', $path, $match)) handle_project_detail($match[1]);
    if ($method === 'GET' && $path === '/admin/enquiries') handle_enquiries_list();
    if (preg_match('#^/admin/enquiries/(\d+)$#', $path, $match)) {
        $id = (int)$match[1];
        if ($method === 'PATCH') handle_enquiry_update($id);
        if ($method === 'DELETE') handle_enquiry_delete($id);
    }
    json_response(['error' => 'Endpoint not found.', 'path' => $path, 'method' => $method], 404);
} catch (PDOException $e) {
    error_log('OVC API database error: ' . $e->getMessage());
    json_response(['error' => 'A database operation failed. Check server configuration and logs.'], 500);
} catch (Throwable $e) {
    error_log('OVC API error: ' . $e->getMessage());
    json_response(['error' => 'An internal server error occurred.'], 500);
}
