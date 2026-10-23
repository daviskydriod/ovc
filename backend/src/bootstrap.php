<?php
declare(strict_types=1);

/** Read a configuration value. Process environment takes precedence over private cPanel config. */
function env_value(string $key, ?string $default = null): ?string {
    $value = getenv($key);
    if ($value !== false && $value !== '') return $value;
    $local = $GLOBALS['OVC_LOCAL_CONFIG'] ?? [];
    if (is_array($local) && isset($local[$key]) && is_scalar($local[$key]) && (string)$local[$key] !== '') return (string)$local[$key];
    return $default;
}

$localConfigFile = dirname(__DIR__) . '/config/local.php';
if (is_file($localConfigFile)) {
    $localConfig = require $localConfigFile;
    $GLOBALS['OVC_LOCAL_CONFIG'] = is_array($localConfig) ? $localConfig : [];
}

/** UTF-8 character count without requiring mbstring. */
function text_length(string $value): int {
    if (function_exists('mb_strlen')) return mb_strlen($value, 'UTF-8');
    $count = preg_match_all('/./us', $value);
    return $count === false ? strlen($value) : $count;
}

/** UTF-8 safe truncation. */
function text_slice(string $value, int $max): string {
    if (function_exists('mb_substr')) return mb_substr($value, 0, $max, 'UTF-8');
    $chars = preg_split('//u', $value, -1, PREG_SPLIT_NO_EMPTY);
    return $chars === false ? substr($value, 0, $max) : implode('', array_slice($chars, 0, $max));
}

/** Emit the standard JSON response and terminate the request. */
function json_response(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

/** Read a bounded JSON object. Reject malformed JSON, arrays and oversized bodies. */
function request_json(int $maxBytes = 220000): array {
    $length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length > $maxBytes) json_response(['error' => 'Request body exceeds the allowed size.'], 413);
    $raw = file_get_contents('php://input', false, null, 0, $maxBytes + 1);
    if ($raw === false || strlen($raw) > $maxBytes) json_response(['error' => 'Request body exceeds the allowed size.'], 413);
    if (!str_starts_with(ltrim($raw), '{')) json_response(['error' => 'Expected a JSON object.'], 400);
    $data = json_decode($raw, true);
    if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE) json_response(['error' => 'Malformed JSON request body.'], 400);
    return $data;
}

/** Return the shared PDO connection configured for utf8mb4 and exception reporting. */
function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $host = env_value('DB_HOST', '127.0.0.1');
    $name = env_value('DB_NAME');
    $user = env_value('DB_USER');
    $pass = env_value('DB_PASSWORD');
    if (!$name || !$user) json_response(['error' => 'Database configuration is incomplete.'], 503);
    if (!preg_match('/^[A-Za-z0-9_]+$/', $name)) json_response(['error' => 'DB_NAME contains invalid characters.'], 503);
    $dsn = 'mysql:host=' . $host . ';dbname=' . $name . ';charset=utf8mb4';
    $pdo = new PDO($dsn, $user, $pass ?? '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_STRINGIFY_FETCHES => false,
    ]);
    return $pdo;
}

/** Require an authenticated administrator session. */
function require_admin(): void {
    if (empty($_SESSION['admin_authenticated'])) json_response(['error' => 'Authentication required.'], 401);
}

/** Require the CSRF token returned by the login/session endpoint. */
function require_csrf(): void {
    $given = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $expected = $_SESSION['csrf_token'] ?? '';
    if (!$given || !$expected || !hash_equals($expected, $given)) json_response(['error' => 'Invalid or missing CSRF token.'], 403);
}

$allowedOrigins = array_values(array_filter(array_map('trim', explode(',', env_value('CORS_ALLOWED_ORIGINS', '') ?? ''))));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    if (!in_array($origin, $allowedOrigins, true)) json_response(['error' => 'Origin is not allowed.'], 403);
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

$secure = filter_var(env_value('SESSION_COOKIE_SECURE', (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'true' : 'false'), FILTER_VALIDATE_BOOLEAN);
$sameSite = env_value('SESSION_SAMESITE', 'Strict');
if (!in_array($sameSite, ['Strict', 'Lax', 'None'], true)) $sameSite = 'Strict';
if ($sameSite === 'None' && !$secure) json_response(['error' => 'SESSION_SAMESITE=None requires SESSION_COOKIE_SECURE=true.'], 500);
session_name('ovc_admin');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => $sameSite]);
session_start();
