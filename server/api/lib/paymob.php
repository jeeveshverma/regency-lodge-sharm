<?php
/**
 * Paymob (Egypt) card payment in EGP, used only after the hotel confirms a request.
 *
 * Flow (Paymob "Intention API" + Unified Checkout, docs read 2026-11-28):
 *   1. POST v1/intention/ with the secret key      -> client_secret
 *   2. send the guest to the checkout page with the public key and that client_secret
 *   3. Paymob POSTs the "transaction processed" callback to /api/paymob/callback?hmac=...
 *      which is the only thing that marks a request as paid.
 *
 * mode 'fake' replaces steps 1-2 with a local test page that sends a signed callback of the same
 * shape, so the whole flow can be tried without a Paymob account.
 */
declare(strict_types=1);

function paymobCfg(): array { return (cfg('paymob') ?: []) + ['mode' => 'off', 'hmac' => '', 'checkout_url' => 'https://eg.checkout.paymob.com/']; }

/** Where to send the guest to pay for this request. */
function paymobCheckoutUrl(array $r): string
{
    $p = paymobCfg();
    if ($p['mode'] === 'fake') return siteUrl() . '/api/pay/fake?ref=' . rawurlencode($r['ref']) . '&k=' . $r['pay_token'];

    $parts = preg_split('/\s+/u', trim($r['name']), 2);
    $payload = [
        'amount' => (int) $r['total'] * 100,
        'currency' => 'EGP',
        'payment_methods' => [(int) $p['integration_id']],
        'items' => [['name' => mb_substr("Reservation {$r['ref']}", 0, 50), 'amount' => (int) $r['total'] * 100, 'quantity' => 1]],
        'billing_data' => [
            'first_name' => $parts[0],
            'last_name' => $parts[1] ?? $parts[0],
            'email' => $r['email'] !== '' ? $r['email'] : (string) (cfg('mail')['from'] ?? ''),
            'phone_number' => $r['phone'],
        ],
        // unique for every attempt; the request number is the part before the last dash
        'special_reference' => $r['ref'] . '-' . bin2hex(random_bytes(3)),
        'notification_url' => siteUrl() . '/api/paymob/callback',
        'redirection_url' => siteUrl() . '/api/paymob/return/' . rawurlencode($r['ref']),
    ];
    $ch = curl_init('https://accept.paymob.com/v1/intention/');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => ['Authorization: Token ' . $p['secret_key'], 'Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 25,
    ]);
    $res = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    $j = is_string($res) ? json_decode($res, true) : null;
    if ($code < 200 || $code >= 300 || empty($j['client_secret'])) {
        throw new RuntimeException('Paymob refused the payment request (HTTP ' . $code . '): ' . mb_substr($err ?: (string) $res, 0, 300));
    }
    return $p['checkout_url'] . '?publicKey=' . rawurlencode($p['public_key']) . '&clientSecret=' . rawurlencode($j['client_secret']);
}

/** The HMAC Paymob sends with a "transaction processed" callback: 20 values of `obj`, in this order, joined without a separator. */
function paymobHmac(array $obj, string $secret): string
{
    $keys = ['amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction', 'id', 'integration_id', 'is_3d_secure', 'is_auth', 'is_capture',
        'is_refunded', 'is_standalone_payment', 'is_voided', 'order.id', 'owner', 'pending', 'source_data.pan', 'source_data.sub_type', 'source_data.type', 'success'];
    $s = '';
    foreach ($keys as $k) {
        $v = $obj;
        foreach (explode('.', $k) as $part) $v = is_array($v) ? ($v[$part] ?? '') : '';
        $s .= is_bool($v) ? ($v ? 'true' : 'false') : (string) $v;
    }
    return hash_hmac('sha512', $s, $secret);
}

/**
 * Handle a "transaction processed" callback. Returns the request it paid, or null when the
 * transaction did not pay anything (failed, pending, refund, unknown reference).
 * Throws on a bad signature or an amount that does not match the request.
 */
function paymobProcess(array $payload, string $hmac): ?array
{
    $obj = $payload['obj'] ?? null;
    if (($payload['type'] ?? '') !== 'TRANSACTION' || !is_array($obj)) return null;
    $secret = (string) paymobCfg()['hmac'];
    if ($secret === '' || !hash_equals(paymobHmac($obj, $secret), strtolower($hmac))) throw new RuntimeException('bad_hmac');

    $paid = ($obj['success'] ?? false) === true && ($obj['pending'] ?? true) === false && empty($obj['is_voided']) && empty($obj['is_refunded']);
    if (!$paid) return null;
    $special = (string) ($obj['order']['merchant_order_id'] ?? '');
    $ref = preg_replace('/-[0-9a-f]{6}$/', '', $special);
    $r = q('SELECT * FROM requests WHERE ref = ?', [$ref])->fetch();
    if (!$r) return null;
    if ((int) $obj['amount_cents'] !== (int) $r['total'] * 100 || ($obj['currency'] ?? '') !== 'EGP') throw new RuntimeException('amount_mismatch');
    if ($r['paid']) return null; // Paymob may repeat a callback
    q('UPDATE requests SET paid = 1, paid_at = ?, paymob_txn = ? WHERE id = ?', [now(), (string) $obj['id'], $r['id']]);
    $r = q('SELECT * FROM requests WHERE id = ?', [$r['id']])->fetch();
    mailGuest($r, 'paid');
    mailHotel($r, 'paid');
    return $r;
}

/** A callback as Paymob would send it for a successful card payment; only for mode 'fake'. */
function paymobFakePayload(array $r): array
{
    return ['type' => 'TRANSACTION', 'obj' => [
        'id' => random_int(100000, 999999), 'amount_cents' => (int) $r['total'] * 100, 'created_at' => gmdate('Y-m-d\TH:i:s.000000'), 'currency' => 'EGP',
        'error_occured' => false, 'has_parent_transaction' => false, 'integration_id' => 1, 'is_3d_secure' => true, 'is_auth' => false, 'is_capture' => false,
        'is_refunded' => false, 'is_standalone_payment' => true, 'is_voided' => false, 'owner' => 1, 'pending' => false, 'success' => true,
        'order' => ['id' => random_int(100000, 999999), 'merchant_order_id' => $r['ref'] . '-' . bin2hex(random_bytes(3))],
        'source_data' => ['pan' => '2346', 'sub_type' => 'MasterCard', 'type' => 'card'],
    ]];
}
