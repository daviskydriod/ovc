<?php
declare(strict_types=1);

function env_value(string $key, ?string $default = null): ?string {
    $value = getenv($key);
    return $value === false || $value === '' ? $default : $value;
}

function json_response(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function request_json(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);
    if (!is_array($data)) json_response(['error' => 'Expected a JSON object.'], 400);
    return $data;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $host = env_value('DB_HOST', '127.0.0.1');
    $name = env_value('DB_NAME');
    $user = env_value('DB_USER');
    $pass = env_value('DB_PASSWORD');
    if (!$name || !$user) json_response(['error' => 'Database configuration is incomplete.'], 503);
    $pdo = new PDO("mysql:host={$host};dbname={$name};charset=utf8mb4", $user, $pass ?? '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function require_admin(): void {
    if (empty($_SESSION['admin_authenticated'])) json_response(['error' => 'Authentication required.'], 401);
}

function require_csrf(): void {
    $given = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $expected = $_SESSION['csrf_token'] ?? '';
    if (!$given || !$expected || !hash_equals($expected, $given)) json_response(['error' => 'Invalid CSRF token.'], 403);
}

function require_method(string $method): void {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
        header('Allow: ' . $method);
        json_response(['error' => 'Method not allowed.'], 405);
    }
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = array_filter(array_map('trim', explode(',', env_value('CORS_ALLOWED_ORIGINS', '') ?? '')));
if ($origin && in_array($origin, $allowed, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

$secure = filter_var(env_value('SESSION_COOKIE_SECURE', (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'true' : 'false'), FILTER_VALIDATE_BOOLEAN);
$sameSite = env_value('SESSION_SAMESITE', 'Strict');
if (!in_array($sameSite, ['Strict', 'Lax', 'None'], true)) $sameSite = 'Strict';
session_name('ovc_admin');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => $sameSite]);
session_start();
