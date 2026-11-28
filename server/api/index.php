<?php
/**
 * Regency Royal Sharm API. One entry point; .htaccess sends every /api/... address here.
 *
 * Public:  GET site · POST requests · POST requests/find · POST requests/cancel
 *          GET pay · GET|POST pay/fake · POST paymob/callback · GET paymob/return/{ref} · POST install
 * Admin (signed in): admin/login, logout, me, requests, rooms, photos, settings, logo, password, mail-test
 */
declare(strict_types=1);

require __DIR__ . '/lib/core.php';
require __DIR__ . '/lib/mail.php';
require __DIR__ . '/lib/paymob.php';
require __DIR__ . '/lib/images.php';

set_exception_handler(function (Throwable $e): void {
    error_log('api: ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
    fail(500, 'server', cfg('debug') ? ['detail' => $e->getMessage()] : []);
});

const PLANS = ['ro', 'bb', 'hb'];
const STATUSES = ['pending', 'confirmed', 'declined', 'cancelled'];
/** What the hotel may change a request to, from each status. */
const MOVES = ['pending' => ['confirmed', 'declined'], 'confirmed' => ['cancelled'], 'declined' => ['pending'], 'cancelled' => ['pending']];

$uri = (string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = trim(substr($uri, strpos($uri, '/api/') + 5), '/');
$seg = explode('/', $path);
$method = $_SERVER['REQUEST_METHOD'];
$route = "$method $path";

// ---------- shapes ----------

function lines(string $s): array { return array_values(array_filter(array_map('trim', preg_split('/\R/u', $s)), fn ($x) => $x !== '')); }

function roomJson(array $r, array $photos): array
{
    return [
        'id' => (int) $r['id'], 'name' => ['ar' => $r['name_ar'], 'en' => $r['name_en']], 'desc' => ['ar' => $r['desc_ar'], 'en' => $r['desc_en']],
        'facilities' => ['ar' => lines($r['facilities_ar']), 'en' => lines($r['facilities_en'])],
        'adults' => (int) $r['adults'], 'children' => (int) $r['children'],
        'prices' => ['ro' => (int) $r['price_ro'], 'bb' => (int) $r['price_bb'], 'hb' => (int) $r['price_hb']],
        'active' => (bool) $r['active'],
        'photos' => array_values(array_map('photoJson', array_filter($photos, fn ($p) => (int) $p['room_id'] === (int) $r['id']))),
    ];
}

function allPhotos(): array { return q('SELECT * FROM photos ORDER BY sort, id')->fetchAll(); }

function logoUrl(): ?string { $l = setting('logo'); return $l ? uploadsUrl() . '/' . $l : null; }

/** What a guest may see of their own request. */
function guestJson(array $r): array
{
    $canPay = $r['status'] === 'confirmed' && $r['pay'] === 'online' && !$r['paid'] && onlinePayOn();
    return [
        'ref' => $r['ref'], 'in' => $r['d_in'], 'out' => $r['d_out'], 'rooms' => (int) $r['rooms'], 'plan' => $r['plan'], 'nights' => (int) $r['nights'],
        'rate' => (int) $r['rate'], 'total' => (int) $r['total'], 'name' => $r['name'], 'phone' => $r['phone'], 'email' => $r['email'],
        'adults' => (int) $r['adults'], 'children' => (int) $r['children'], 'bed' => $r['bed'], 'arrival' => $r['arrival'], 'pay' => $r['pay'], 'note' => $r['note'],
        'status' => $r['status'], 'created' => isoUtc($r['created_at']), 'room' => $r['room_id'] === null ? null : (int) $r['room_id'],
        'roomName' => ['ar' => $r['room_ar'], 'en' => $r['room_en']], 'paid' => (bool) $r['paid'], 'payUrl' => $canPay ? payUrl($r) : null, 'hotelNote' => $r['hotel_note'],
    ];
}

function adminJson(array $r): array
{
    return guestJson($r) + [
        'id' => (int) $r['id'], 'lang' => $r['lang'], 'decidedAt' => isoUtc($r['decided_at']), 'paidAt' => isoUtc($r['paid_at']), 'paymobTxn' => $r['paymob_txn'],
        'payLink' => $r['pay'] === 'online' && onlinePayOn() ? payUrl($r) : null, 'mineUrl' => mineUrl($r), 'moves' => MOVES[$r['status']],
    ];
}

function findRequest(array $in): array
{
    $ref = strtoupper(str($in, 'ref', 20));
    $r = q('SELECT * FROM requests WHERE ref = ?', [$ref])->fetch();
    if (!$r || !hash_equals($r['phone_key'], phoneKey(str($in, 'phone', 40)))) fail(404, 'not_found');
    return $r;
}

/** A small page for the guest when a payment link cannot be used. */
function page(string $ar, string $en, int $code = 200): never
{
    http_response_code($code);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Regency Royal Sharm</title>'
        . '<body style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:14vh auto;padding:0 20px;color:#10203f;line-height:1.7">'
        . '<p dir="rtl" style="font-size:1.2rem">' . $ar . '</p><p>' . $en . '</p><p><a href="' . esc(siteUrl() . '/') . '">Regency Royal Sharm</a></p>';
    exit;
}

function requireAdmin(): array
{
    startSession();
    if (empty($_SESSION['uid'])) fail(401, 'signed_out');
    if ($_SERVER['REQUEST_METHOD'] !== 'GET' && ($_SERVER['HTTP_X_RR'] ?? '') !== '1') fail(403, 'bad_origin');
    $u = q('SELECT id, email, name FROM users WHERE id = ?', [$_SESSION['uid']])->fetch();
    if (!$u) fail(401, 'signed_out');
    return $u;
}

function startSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    session_name('rr_admin');
    session_set_cookie_params(['lifetime' => 0, 'path' => rootPath() . '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Lax']);
    session_start();
}

function textDefaults(): array
{
    $f = __DIR__ . '/seed/texts.json';
    return is_file($f) ? (json_decode((string) file_get_contents($f), true) ?: []) : [];
}

// ---------- public ----------

if ($route === 'GET site') {
    $photos = allPhotos();
    $rooms = [];
    foreach (q('SELECT * FROM rooms WHERE active = 1 ORDER BY sort, id') as $r) $rooms[] = roomJson($r, $photos);
    $c = setting('contact', []);
    out([
        'name' => setting('name'), 'logo' => logoUrl(), 'address' => setting('address'),
        'contact' => ['phone' => $c['phone'] ?? '', 'whatsapp' => $c['whatsapp'] ?? '', 'email' => $c['email'] ?? ''],
        'checkIn' => setting('checkIn', '14:00'), 'checkOut' => setting('checkOut', '12:00'), 'ratesUntil' => setting('ratesUntil', ''),
        'rooms' => $rooms,
        'gallery' => array_values(array_map('photoJson', array_filter($photos, fn ($p) => $p['room_id'] === null))),
        'texts' => (object) setting('texts', []), 'payOnline' => onlinePayOn(),
    ]);
}

if ($route === 'POST requests') {
    $in = body();
    if (str($in, 'website') !== '') fail(400, 'bad_field'); // a field people never see; only robots fill it
    throttle('req:' . clientIp(), 8, 60);

    $dIn = str($in, 'in', 10); $dOut = str($in, 'out', 10);
    foreach ([$dIn, $dOut] as $d) {
        $p = date_create_immutable_from_format('!Y-m-d', $d);
        if (!$p || $p->format('Y-m-d') !== $d) fail(400, 'bad_field', ['field' => 'dates']);
    }
    $nights = (int) ((strtotime($dOut) - strtotime($dIn)) / 86400);
    if ($dIn < date('Y-m-d') || $nights < 1 || $nights > 30) fail(400, 'bad_field', ['field' => 'dates']);
    $until = (string) setting('ratesUntil', '');
    if ($until !== '' && date('Y-m-d', strtotime($dOut) - 86400) > $until) fail(409, 'on_request');

    $room = q('SELECT * FROM rooms WHERE id = ? AND active = 1', [(int) ($in['room'] ?? 0)])->fetch()
        ?: (empty($in['room']) ? q('SELECT * FROM rooms WHERE active = 1 ORDER BY sort, id LIMIT 1')->fetch() : false);
    if (!$room) fail(400, 'bad_field', ['field' => 'room']);
    $rooms = (int) ($in['rooms'] ?? 0); $plan = str($in, 'plan', 4);
    if ($rooms < 1 || $rooms > 5 || !in_array($plan, PLANS, true)) fail(400, 'bad_field', ['field' => 'stay']);

    $name = str($in, 'name', 120); $phone = str($in, 'phone', 40); $email = str($in, 'email', 190); $note = str($in, 'note', 1000);
    $adults = (int) ($in['adults'] ?? 0); $children = (int) ($in['children'] ?? 0);
    $bed = str($in, 'bed', 10); $arrival = str($in, 'arrival', 10); $pay = str($in, 'pay', 10);
    $key = phoneKey($phone);
    if (mb_strlen($name) < 3) fail(400, 'bad_field', ['field' => 'name']);
    if (strlen($key) < 8 || strlen($key) > 14) fail(400, 'bad_field', ['field' => 'phone']);
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) fail(400, 'bad_field', ['field' => 'email']);
    if ($adults < 1 || $adults > $rooms * max(1, (int) $room['adults']) || $children < 0 || $children > $rooms * (int) $room['children']) fail(400, 'bad_field', ['field' => 'party']);
    if (!in_array($bed, ['double', 'twin'], true) || !in_array($arrival, ['arr1', 'arr2', 'arr3', 'arr4'], true)) fail(400, 'bad_field', ['field' => 'bed']);
    if (!in_array($pay, ['arrival', 'online'], true) || ($pay === 'online' && !onlinePayOn())) fail(400, 'bad_field', ['field' => 'pay']);

    // the price is worked out here, from the dashboard's prices; what the browser showed is not trusted
    $rate = (int) $room["price_$plan"];
    $total = $rate * $nights * $rooms;
    $abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I
    for ($try = 0; ; $try++) {
        $ref = 'RR-';
        for ($i = 0; $i < 5; $i++) $ref .= $abc[random_int(0, 31)];
        try {
            q('INSERT INTO requests (ref, room_id, room_ar, room_en, d_in, d_out, rooms, plan, nights, rate, total, name, phone, phone_key, email, adults, children, bed, arrival, pay, note, lang, hotel_note, pay_token, ip, created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                [$ref, $room['id'], $room['name_ar'], $room['name_en'], $dIn, $dOut, $rooms, $plan, $nights, $rate, $total, $name, $phone, $key, $email, $adults, $children, $bed, $arrival, $pay, $note,
                    ($in['lang'] ?? '') === 'en' ? 'en' : 'ar', '', bin2hex(random_bytes(16)), clientIp(), now()]);
            break;
        } catch (PDOException $e) {
            if ($try >= 4 || $e->getCode() !== '23000') throw $e; // 23000: that number is taken, draw another
        }
    }
    $r = q('SELECT * FROM requests WHERE ref = ?', [$ref])->fetch();
    mailHotel($r, 'new');
    mailGuest($r, 'pending');
    out(guestJson($r), 201);
}

if ($route === 'POST requests/find') {
    throttle('find:' . clientIp(), 40, 60);
    out(guestJson(findRequest(body())));
}

if ($route === 'POST requests/cancel') {
    throttle('find:' . clientIp(), 40, 60);
    $r = findRequest(body());
    if ($r['paid']) fail(409, 'paid');
    if (in_array($r['status'], ['pending', 'confirmed'], true)) {
        q("UPDATE requests SET status = 'cancelled', decided_at = ? WHERE id = ?", [now(), $r['id']]);
        $r = q('SELECT * FROM requests WHERE id = ?', [$r['id']])->fetch();
        mailHotel($r, 'cancelled');
    }
    out(guestJson($r));
}

if ($route === 'GET pay' || $path === 'pay/fake') {
    $r = q('SELECT * FROM requests WHERE ref = ?', [strtoupper((string) ($_GET['ref'] ?? ''))])->fetch();
    if (!$r || !hash_equals($r['pay_token'], (string) ($_GET['k'] ?? ''))) page('رابط الدفع غير صحيح.', 'This payment link is not valid.', 404);
    if ($r['paid']) { header('Location: ' . mineUrl($r)); exit; }
    if ($r['status'] !== 'confirmed' || $r['pay'] !== 'online') page('الدفع أونلاين يُفتح بعد تأكيد الفندق لحجزك.', 'Online payment opens after the hotel confirms your reservation.', 409);
    if (!onlinePayOn()) page('الدفع أونلاين غير متاح الآن. تواصل مع الفندق.', 'Online payment is not available right now. Please contact the hotel.', 503);

    if ($route === 'GET pay') {
        try { $url = paymobCheckoutUrl($r); } catch (Throwable $e) {
            error_log('paymob: ' . $e->getMessage());
            page('تعذّر فتح صفحة الدفع. حاول بعد قليل أو تواصل مع الفندق.', 'The payment page could not be opened. Try again shortly or contact the hotel.', 502);
        }
        header('Location: ' . $url);
        exit;
    }
    // the local stand-in for Paymob's card page
    if (paymobCfg()['mode'] !== 'fake') fail(404, 'not_found');
    if ($method === 'POST') {
        $payload = paymobFakePayload($r);
        paymobProcess($payload, paymobHmac($payload['obj'], (string) paymobCfg()['hmac']));
        header('Location: ' . mineUrl($r));
        exit;
    }
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Test payment</title>'
        . '<body style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:12vh auto;padding:0 20px;color:#10203f">'
        . '<h1 style="font-size:1.3rem">Test payment page</h1><p>This stands in for Paymob while no account is connected. No money moves.</p>'
        . '<p><b>' . esc($r['ref']) . '</b> · ' . esc($r['name']) . ' · <b id="amount">' . number_format((int) $r['total']) . ' EGP</b></p>'
        . '<form method="post"><button id="fake-pay" style="font:inherit;font-weight:bold;background:#1553b6;color:#fff;border:0;padding:12px 26px;cursor:pointer">Pay (test)</button></form>';
    exit;
}

if ($route === 'POST paymob/callback') {
    try {
        paymobProcess(body(), (string) ($_GET['hmac'] ?? ''));
    } catch (RuntimeException $e) {
        error_log('paymob callback refused: ' . $e->getMessage());
        fail(400, $e->getMessage());
    }
    out(['ok' => true]);
}

if ($method === 'GET' && $seg[0] === 'paymob' && ($seg[1] ?? '') === 'return') {
    // the guest's browser coming back from Paymob; the status itself only ever changes in the callback above
    $r = q('SELECT * FROM requests WHERE ref = ?', [strtoupper(rawurldecode($seg[2] ?? ''))])->fetch();
    header('Location: ' . ($r ? mineUrl($r) : siteUrl() . '/'));
    exit;
}

if ($route === 'POST install') {
    $in = body();
    $key = (string) cfg('install_key');
    if ($key === '' || $key === 'change-me' || !hash_equals($key, str($in, 'key', 200))) fail(403, 'bad_key');
    foreach (array_filter(array_map('trim', explode(';', (string) file_get_contents(__DIR__ . '/schema.sql')))) as $sql) {
        if (preg_match('/^(\s*--.*\R)*\s*CREATE TABLE/i', $sql)) db()->exec($sql);
    }
    if ((int) q('SELECT COUNT(*) FROM users')->fetchColumn() > 0) fail(409, 'already_installed');
    $email = strtolower(str($in, 'email', 190)); $pass = (string) ($in['password'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($pass) < 10) fail(400, 'bad_field', ['field' => 'email_or_password']);
    q('INSERT INTO users (email, name, pass_hash, created_at) VALUES (?, ?, ?, ?)', [$email, str($in, 'name', 120) ?: 'Admin', password_hash($pass, PASSWORD_DEFAULT), now()]);

    // first content: what the site showed before the dashboard existed
    $seedFile = __DIR__ . '/seed/seed.json';
    $seeded = false;
    if (is_file($seedFile) && (int) q('SELECT COUNT(*) FROM rooms')->fetchColumn() === 0) {
        $seed = json_decode((string) file_get_contents($seedFile), true);
        $dir = ensureUploads();
        $copy = function (string $file) use ($dir): string {
            foreach ([$file, preg_replace('/\.jpg$/', '-s.jpg', $file)] as $f) {
                if (!copy(__DIR__ . "/seed/photos/$f", "$dir/seed-$f")) throw new RuntimeException("seed photo $f could not be copied");
            }
            return "seed-$file";
        };
        foreach ($seed['settings'] as $k => $v) saveSetting($k, $v);
        foreach ($seed['rooms'] as $i => $room) {
            q('INSERT INTO rooms (name_ar, name_en, desc_ar, desc_en, facilities_ar, facilities_en, adults, children, price_ro, price_bb, price_hb, sort) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                [$room['name_ar'], $room['name_en'], $room['desc_ar'], $room['desc_en'], $room['facilities_ar'], $room['facilities_en'], $room['adults'], $room['children'], $room['price_ro'], $room['price_bb'], $room['price_hb'], $i]);
            $id = (int) db()->lastInsertId();
            foreach ($room['photos'] as $j => $p) q('INSERT INTO photos (room_id, file, cap_ar, cap_en, sort) VALUES (?,?,?,?,?)', [$id, $copy($p['file']), $p['cap_ar'], $p['cap_en'], $j]);
        }
        foreach ($seed['gallery'] as $j => $p) q('INSERT INTO photos (room_id, file, cap_ar, cap_en, wide, sort) VALUES (NULL,?,?,?,?,?)', [$copy($p['file']), $p['cap_ar'], $p['cap_en'], empty($p['wide']) ? 0 : 1, $j]);
        $seeded = true;
    }
    out(['ok' => true, 'seeded' => $seeded], 201);
}

// ---------- admin ----------

if ($seg[0] !== 'admin') fail(404, 'not_found');
$a = implode('/', array_slice($seg, 1));
$id = isset($seg[2]) && ctype_digit($seg[2]) ? (int) $seg[2] : 0;

if ("$method $a" === 'POST login') {
    $in = body();
    throttle('login:' . clientIp(), 10, 15);
    $u = q('SELECT * FROM users WHERE email = ?', [strtolower(str($in, 'email', 190))])->fetch();
    if (!$u || !password_verify((string) ($in['password'] ?? ''), $u['pass_hash'])) fail(401, 'bad_login');
    startSession();
    session_regenerate_id(true);
    $_SESSION['uid'] = (int) $u['id'];
    out(['email' => $u['email'], 'name' => $u['name']]);
}

if ("$method $a" === 'POST logout') {
    startSession();
    $_SESSION = [];
    session_destroy();
    out(['ok' => true]);
}

$user = requireAdmin();

if ("$method $a" === 'GET me') out(['email' => $user['email'], 'name' => $user['name']]);

if ("$method $a" === 'GET requests') {
    $status = (string) ($_GET['status'] ?? '');
    $rows = in_array($status, STATUSES, true)
        ? q('SELECT * FROM requests WHERE status = ? ORDER BY created_at DESC LIMIT 500', [$status])->fetchAll()
        : q('SELECT * FROM requests ORDER BY created_at DESC LIMIT 500')->fetchAll();
    $counts = array_fill_keys(STATUSES, 0);
    foreach (q('SELECT status, COUNT(*) n FROM requests GROUP BY status') as $c) $counts[$c['status']] = (int) $c['n'];
    out(['requests' => array_map('adminJson', $rows), 'counts' => $counts]);
}

if ($method === 'POST' && ($seg[1] ?? '') === 'requests' && $id && ($seg[3] ?? '') === 'status') {
    $in = body();
    $r = q('SELECT * FROM requests WHERE id = ?', [$id])->fetch();
    if (!$r) fail(404, 'not_found');
    $to = str($in, 'status', 12);
    if (!in_array($to, MOVES[$r['status']], true)) fail(409, 'bad_move');
    q('UPDATE requests SET status = ?, hotel_note = ?, decided_at = ? WHERE id = ?', [$to, str($in, 'note', 1000), now(), $id]);
    $r = q('SELECT * FROM requests WHERE id = ?', [$id])->fetch();
    if ($to !== 'pending') mailGuest($r, $to);
    out(adminJson($r));
}

if ("$method $a" === 'GET rooms') {
    $photos = allPhotos();
    out(['rooms' => array_map(fn ($r) => roomJson($r, $photos), q('SELECT * FROM rooms ORDER BY sort, id')->fetchAll())]);
}

if ("$method $a" === 'POST rooms') {
    $in = body();
    $v = [str($in, 'name_ar', 120), str($in, 'name_en', 120), str($in, 'desc_ar', 2000), str($in, 'desc_en', 2000), str($in, 'facilities_ar', 3000), str($in, 'facilities_en', 3000),
        (int) ($in['adults'] ?? 2), (int) ($in['children'] ?? 0), (int) ($in['price_ro'] ?? 0), (int) ($in['price_bb'] ?? 0), (int) ($in['price_hb'] ?? 0), empty($in['active']) ? 0 : 1, (int) ($in['sort'] ?? 0)];
    if ($v[0] === '' || $v[1] === '') fail(400, 'bad_field', ['field' => 'name']);
    if ($v[6] < 1 || $v[6] > 10 || $v[7] < 0 || $v[7] > 10) fail(400, 'bad_field', ['field' => 'party']);
    foreach ([$v[8], $v[9], $v[10]] as $price) if ($price < 1 || $price > 10000000) fail(400, 'bad_field', ['field' => 'price']);
    $rid = (int) ($in['id'] ?? 0);
    if ($rid) {
        q('UPDATE rooms SET name_ar=?, name_en=?, desc_ar=?, desc_en=?, facilities_ar=?, facilities_en=?, adults=?, children=?, price_ro=?, price_bb=?, price_hb=?, active=?, sort=? WHERE id=?', [...$v, $rid]);
    } else {
        q('INSERT INTO rooms (name_ar, name_en, desc_ar, desc_en, facilities_ar, facilities_en, adults, children, price_ro, price_bb, price_hb, active, sort) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', $v);
        $rid = (int) db()->lastInsertId();
    }
    out(roomJson(q('SELECT * FROM rooms WHERE id = ?', [$rid])->fetch(), allPhotos()));
}

if ($method === 'POST' && ($seg[1] ?? '') === 'rooms' && $id && ($seg[3] ?? '') === 'delete') {
    foreach (q('SELECT file FROM photos WHERE room_id = ?', [$id]) as $p) deletePhotoFiles($p['file']);
    q('DELETE FROM photos WHERE room_id = ?', [$id]);
    q('DELETE FROM rooms WHERE id = ?', [$id]); // past requests keep the room's name
    out(['ok' => true]);
}

if ("$method $a" === 'GET photos') out(['photos' => array_map('photoJson', allPhotos())]);

if ("$method $a" === 'POST photos/upload') {
    $room = ctype_digit((string) ($_POST['room'] ?? '')) ? (int) $_POST['room'] : null;
    if ($room !== null && !q('SELECT 1 FROM rooms WHERE id = ?', [$room])->fetch()) fail(400, 'bad_field', ['field' => 'room']);
    $file = savePhoto('file');
    $sort = (int) q('SELECT COALESCE(MAX(sort), 0) + 1 FROM photos')->fetchColumn();
    q('INSERT INTO photos (room_id, file, sort) VALUES (?, ?, ?)', [$room, $file, $sort]);
    out(photoJson(q('SELECT * FROM photos WHERE id = ?', [(int) db()->lastInsertId()])->fetch()), 201);
}

if ("$method $a" === 'POST photos/order') {
    foreach (array_values((array) (body()['ids'] ?? [])) as $i => $pid) q('UPDATE photos SET sort = ? WHERE id = ?', [$i, (int) $pid]);
    out(['ok' => true]);
}

if ($method === 'POST' && ($seg[1] ?? '') === 'photos' && $id && !isset($seg[3])) {
    $in = body();
    q('UPDATE photos SET cap_ar = ?, cap_en = ?, wide = ? WHERE id = ?', [str($in, 'cap_ar', 200), str($in, 'cap_en', 200), empty($in['wide']) ? 0 : 1, $id]);
    out(photoJson(q('SELECT * FROM photos WHERE id = ?', [$id])->fetch() ?: fail(404, 'not_found')));
}

if ($method === 'POST' && ($seg[1] ?? '') === 'photos' && $id && ($seg[3] ?? '') === 'delete') {
    $p = q('SELECT * FROM photos WHERE id = ?', [$id])->fetch();
    if ($p) { deletePhotoFiles($p['file']); q('DELETE FROM photos WHERE id = ?', [$id]); }
    out(['ok' => true]);
}

if ("$method $a" === 'GET settings') {
    out([
        'name' => setting('name', ['ar' => '', 'en' => '']), 'address' => setting('address', ['ar' => '', 'en' => '']), 'contact' => (object) setting('contact', []),
        'checkIn' => setting('checkIn', '14:00'), 'checkOut' => setting('checkOut', '12:00'), 'ratesUntil' => setting('ratesUntil', ''),
        'texts' => (object) setting('texts', []), 'textDefaults' => (object) textDefaults(), 'logo' => logoUrl(),
        'payOnline' => onlinePayOn(), 'paymobMode' => paymobCfg()['mode'], 'mailFrom' => (string) (cfg('mail')['from'] ?? ''),
        'mailLog' => q('SELECT sent_to, subject, ok, error, at FROM mail_log ORDER BY id DESC LIMIT 15')->fetchAll(),
    ]);
}

if ("$method $a" === 'POST settings') {
    $in = body();
    $pair = fn ($x, int $max) => ['ar' => str((array) $x, 'ar', $max), 'en' => str((array) $x, 'en', $max)];
    if (isset($in['name'])) { $n = $pair($in['name'], 120); if ($n['ar'] === '' || $n['en'] === '') fail(400, 'bad_field', ['field' => 'name']); saveSetting('name', $n); }
    if (isset($in['address'])) saveSetting('address', $pair($in['address'], 250));
    if (isset($in['contact'])) {
        $c = (array) $in['contact'];
        $contact = ['phone' => str($c, 'phone', 40), 'whatsapp' => str($c, 'whatsapp', 40), 'email' => str($c, 'email', 190), 'bookingEmail' => str($c, 'bookingEmail', 190)];
        foreach (['email', 'bookingEmail'] as $k) if ($contact[$k] !== '' && !filter_var($contact[$k], FILTER_VALIDATE_EMAIL)) fail(400, 'bad_field', ['field' => $k]);
        saveSetting('contact', $contact);
    }
    foreach (['checkIn', 'checkOut'] as $k) {
        if (!isset($in[$k])) continue;
        if (!preg_match('/^\d{2}:\d{2}$/', (string) $in[$k])) fail(400, 'bad_field', ['field' => $k]);
        saveSetting($k, $in[$k]);
    }
    if (isset($in['ratesUntil'])) {
        if ($in['ratesUntil'] !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $in['ratesUntil'])) fail(400, 'bad_field', ['field' => 'ratesUntil']);
        saveSetting('ratesUntil', $in['ratesUntil']);
    }
    if (isset($in['texts'])) {
        $texts = [];
        foreach (array_keys(textDefaults()) as $k) {
            $t = $pair($in['texts'][$k] ?? [], 1500);
            if ($t['ar'] !== '' || $t['en'] !== '') $texts[$k] = $t; // an empty box means "use the site's own wording"
        }
        saveSetting('texts', $texts);
    }
    out(['ok' => true]);
}

if ("$method $a" === 'POST logo') {
    $old = setting('logo');
    saveSetting('logo', saveLogo('file'));
    if ($old) deletePhotoFiles($old);
    out(['logo' => uploadsUrl() . '/' . json_decode((string) q("SELECT v FROM settings WHERE k = 'logo'")->fetchColumn(), true)]);
}

if ("$method $a" === 'POST logo/delete') {
    if ($old = setting('logo')) deletePhotoFiles($old);
    saveSetting('logo', null);
    out(['ok' => true]);
}

if ("$method $a" === 'POST password') {
    $in = body();
    $row = q('SELECT pass_hash FROM users WHERE id = ?', [$user['id']])->fetch();
    if (!password_verify((string) ($in['current'] ?? ''), $row['pass_hash'])) fail(400, 'bad_login');
    if (strlen((string) ($in['next'] ?? '')) < 10) fail(400, 'bad_field', ['field' => 'password']);
    q('UPDATE users SET pass_hash = ? WHERE id = ?', [password_hash((string) $in['next'], PASSWORD_DEFAULT), $user['id']]);
    out(['ok' => true]);
}

if ("$method $a" === 'POST mail-test') {
    $to = (string) (setting('contact', [])['bookingEmail'] ?? '');
    if ($to === '') fail(400, 'no_booking_email');
    $ok = sendMail($to, 'Test email / رسالة تجريبية', mailShell('ar', '<p>هذه رسالة تجريبية من لوحة التحكم. البريد يعمل.</p><p dir="ltr">This is a test email from the dashboard. Email works.</p>'));
    $last = q('SELECT error FROM mail_log ORDER BY id DESC LIMIT 1')->fetchColumn();
    out(['ok' => $ok, 'to' => $to, 'error' => $ok ? '' : $last]);
}

fail(404, 'not_found');
