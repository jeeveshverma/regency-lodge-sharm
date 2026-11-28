<?php
/** Config, database, JSON in and out, settings, rate limits. */
declare(strict_types=1);

date_default_timezone_set('Africa/Cairo');

function cfg(string $key)
{
    static $c = null;
    if ($c === null) {
        // RR_CONFIG is only set by the local docker setup; on a server the file sits next to index.php
        $file = getenv('RR_CONFIG') ?: __DIR__ . '/../config.php';
        if (!is_file($file)) fail(500, 'not_configured');
        $c = require $file;
    }
    return $c[$key] ?? null;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $d = cfg('db');
        $pdo = new PDO("mysql:host={$d['host']};port=" . ($d['port'] ?? 3306) . ";dbname={$d['name']};charset=utf8mb4", $d['user'], $d['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $pdo->exec("SET time_zone = '+00:00'");
    }
    return $pdo;
}

/** Run a statement with values; returns the statement. */
function q(string $sql, array $args = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute($args);
    return $st;
}

function now(): string { return gmdate('Y-m-d H:i:s'); }
function isoUtc(?string $dt): ?string { return $dt ? str_replace(' ', 'T', $dt) . 'Z' : null; }

function out($data, int $code = 200): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

function fail(int $code, string $error, array $extra = []): never
{
    out(['error' => $error] + $extra, $code);
}

function body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) return [];
    $j = json_decode($raw, true);
    if (!is_array($j)) fail(400, 'bad_json');
    return $j;
}

function str(array $a, string $k, int $max = 250): string
{
    $v = $a[$k] ?? '';
    if (!is_string($v) && !is_numeric($v)) fail(400, 'bad_field', ['field' => $k]);
    $v = trim((string) $v);
    if (mb_strlen($v) > $max) fail(400, 'too_long', ['field' => $k]);
    return $v;
}

function clientIp(): string { return substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45); }

/** Path of the site root on this host: '' at a domain root, '/sub' in a folder. */
function rootPath(): string
{
    return rtrim(str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME']))), '/');
}

/** Absolute address of the site root, without a trailing slash. */
function siteUrl(): string
{
    $u = (string) cfg('site_url');
    if ($u !== '') return rtrim($u, '/');
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    return ($https ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . rootPath();
}

function uploadsDir(): string { return cfg('uploads_dir') ?: dirname(__DIR__, 2) . '/uploads'; }
function uploadsUrl(): string { return rootPath() . '/uploads'; }

/** Settings are JSON values under a key. */
function setting(string $k, $default = null)
{
    static $all = null;
    if ($all === null) {
        $all = [];
        foreach (q('SELECT k, v FROM settings') as $row) $all[$row['k']] = json_decode($row['v'], true);
    }
    return $all[$k] ?? $default;
}

function saveSetting(string $k, $v): void
{
    q('INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)', [$k, json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
}

/** Count this action; refuse with 429 once `max` were made within `minutes`. */
function throttle(string $key, int $max, int $minutes): void
{
    if (cfg('no_limits')) return; // local testing only
    $since = gmdate('Y-m-d H:i:s', time() - $minutes * 60);
    $n = (int) q('SELECT COUNT(*) FROM throttle WHERE k = ? AND at > ?', [$key, $since])->fetchColumn();
    if ($n >= $max) fail(429, 'too_many');
    q('INSERT INTO throttle (k, at) VALUES (?, ?)', [$key, now()]);
    if (random_int(1, 50) === 1) q('DELETE FROM throttle WHERE at < ?', [gmdate('Y-m-d H:i:s', time() - 86400)]);
}

/** Phone numbers compare by their digits, without a leading 0, 20 or 0020 (same rule as the site). */
function phoneKey(string $p): string
{
    return preg_replace('/^(0020|20|0)/', '', preg_replace('/\D/', '', $p));
}

function onlinePayOn(): bool
{
    $p = cfg('paymob') ?: [];
    $mode = $p['mode'] ?? 'off';
    return $mode === 'fake' || ($mode === 'live' && !empty($p['secret_key']) && !empty($p['public_key']) && !empty($p['integration_id']) && !empty($p['hmac']));
}
