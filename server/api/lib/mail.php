<?php
/** Email: a small SMTP sender (no library needed on shared hosting) and the messages about a request. */
declare(strict_types=1);

/** Send one HTML email. Never throws: the result is written to mail_log and returned. */
function sendMail(string $to, string $subject, string $html, string $replyTo = ''): bool
{
    $error = '';
    try {
        $m = cfg('mail') ?: [];
        if (empty($m['from'])) throw new RuntimeException('mail.from is not set in config.php');
        $fromName = (string) (setting('name')['en'] ?? 'Regency Royal Sharm');
        $headers = [
            'Date: ' . date('r'),
            'From: ' . mimeWord($fromName) . " <{$m['from']}>",
            "To: <$to>",
            'Subject: ' . mimeWord($subject),
            'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . substr(strrchr($m['from'], '@') ?: '@localhost', 1) . '>',
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
        ];
        if ($replyTo !== '') $headers[] = "Reply-To: <$replyTo>";
        $bodyText = rtrim(chunk_split(base64_encode($html)));
        if (empty($m['host'])) {
            // no SMTP server configured: hand the message to the host's own mailer
            $h = array_values(array_filter($headers, fn ($x) => !preg_match('/^(To|Subject):/', $x)));
            if (!mail($to, mimeWord($subject), $bodyText, implode("\r\n", $h))) throw new RuntimeException('mail() refused the message');
        } else {
            smtpSend($m, $to, implode("\r\n", $headers) . "\r\n\r\n" . $bodyText);
        }
    } catch (Throwable $e) {
        $error = mb_substr($e->getMessage(), 0, 480);
        error_log("mail to $to failed: $error");
    }
    q('INSERT INTO mail_log (sent_to, subject, ok, error, at) VALUES (?, ?, ?, ?, ?)', [$to, mb_substr($subject, 0, 240), $error === '' ? 1 : 0, $error, now()]);
    return $error === '';
}

function mimeWord(string $s): string
{
    return preg_match('/^[\x20-\x7E]*$/', $s) ? $s : '=?UTF-8?B?' . base64_encode($s) . '?=';
}

function smtpSend(array $m, string $to, string $message): void
{
    $secure = $m['secure'] ?? '';
    $fp = @stream_socket_client(($secure === 'ssl' ? 'ssl://' : 'tcp://') . $m['host'] . ':' . (int) $m['port'], $errno, $errstr, 15);
    if (!$fp) throw new RuntimeException("SMTP connect failed: $errstr");
    stream_set_timeout($fp, 20);
    $read = function () use ($fp): string {
        $all = '';
        while (($line = fgets($fp, 600)) !== false) {
            $all .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') break;
        }
        return $all;
    };
    $cmd = function (string $c, array $ok) use ($fp, $read): string {
        if ($c !== '') fwrite($fp, $c . "\r\n");
        $r = $read();
        if (!in_array((int) substr($r, 0, 3), $ok, true)) throw new RuntimeException('SMTP said: ' . trim($r));
        return $r;
    };
    try {
        $host = $_SERVER['SERVER_NAME'] ?? 'localhost';
        $cmd('', [220]);
        $cmd("EHLO $host", [250]);
        if ($secure === 'tls') {
            $cmd('STARTTLS', [220]);
            if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) throw new RuntimeException('SMTP TLS failed');
            $cmd("EHLO $host", [250]);
        }
        if (!empty($m['user'])) {
            $cmd('AUTH LOGIN', [334]);
            $cmd(base64_encode($m['user']), [334]);
            $cmd(base64_encode((string) $m['pass']), [235]);
        }
        $cmd("MAIL FROM:<{$m['from']}>", [250]);
        $cmd("RCPT TO:<$to>", [250, 251]);
        $cmd('DATA', [354]);
        $cmd(preg_replace('/^\./m', '..', $message) . "\r\n.", [250]);
        fwrite($fp, "QUIT\r\n");
    } finally {
        fclose($fp);
    }
}

const MAIL_T = [
    'en' => [
        'ref' => 'Request number', 'guest' => 'Guest', 'phone' => 'Phone', 'email' => 'Email', 'room' => 'Room', 'in' => 'Check-in', 'out' => 'Check-out',
        'stay' => 'Stay', 'nights' => 'nights', 'rooms' => 'rooms', 'plan' => 'Meals', 'party' => 'Guests', 'adults' => 'adults', 'children' => 'children',
        'bed' => 'Bed', 'arrival' => 'Arrival', 'pay' => 'Payment', 'total' => 'Total', 'egp' => 'EGP', 'note' => 'Notes', 'hotelNote' => 'Message from the hotel',
        'ro' => 'Room only', 'bb' => 'With breakfast', 'hb' => 'Breakfast and dinner', 'double' => 'One double', 'twin' => 'Two singles',
        'arr1' => 'Before 2 pm', 'arr2' => '2 pm to 6 pm', 'arr3' => '6 pm to 10 pm', 'arr4' => 'After 10 pm',
        'payArrival' => 'Pay on arrival, at reception', 'payOnline' => 'Pay online by card, in EGP',
        'pendingS' => 'We received your request {ref}', 'pendingB' => 'Thank you. Your reservation request is pending hotel confirmation. Our booking team checks availability and answers you. Nothing is charged now.',
        'confirmedS' => 'Your reservation {ref} is confirmed', 'confirmedB' => 'Good news: the hotel has confirmed your reservation.',
        'confirmedPay' => 'You chose to pay online. Use this button to pay by card in EGP:', 'payBtn' => 'Pay now', 'confirmedArr' => 'You pay at reception when you arrive.',
        'declinedS' => 'About your request {ref}', 'declinedB' => 'We are sorry: the hotel could not accept this request. You are welcome to try other dates or to contact us.',
        'cancelledS' => 'Your reservation {ref} is cancelled', 'cancelledB' => 'This reservation has been cancelled. Contact us if this is a mistake.',
        'paidS' => 'Payment received for {ref}', 'paidB' => 'We received your payment. See you in Sharm El Sheikh.',
        'view' => 'See your reservation', 'contact' => 'Phone {phone} · WhatsApp {wa}',
    ],
    'ar' => [
        'ref' => 'رقم الطلب', 'guest' => 'النزيل', 'phone' => 'الهاتف', 'email' => 'البريد', 'room' => 'الغرفة', 'in' => 'الوصول', 'out' => 'المغادرة',
        'stay' => 'الإقامة', 'nights' => 'ليالٍ', 'rooms' => 'غرف', 'plan' => 'الوجبات', 'party' => 'الأشخاص', 'adults' => 'بالغون', 'children' => 'أطفال',
        'bed' => 'السرير', 'arrival' => 'وقت الوصول', 'pay' => 'الدفع', 'total' => 'الإجمالي', 'egp' => 'جنيه', 'note' => 'ملاحظات', 'hotelNote' => 'رسالة من الفندق',
        'ro' => 'بدون وجبات', 'bb' => 'مع الإفطار', 'hb' => 'إفطار وعشاء', 'double' => 'سرير مزدوج', 'twin' => 'سريران',
        'arr1' => 'قبل 2 ظهرًا', 'arr2' => 'من 2 ظهرًا إلى 6 مساءً', 'arr3' => 'من 6 إلى 10 مساءً', 'arr4' => 'بعد 10 مساءً',
        'payArrival' => 'الدفع عند الوصول في الاستقبال', 'payOnline' => 'الدفع أونلاين بالبطاقة، بالجنيه',
        'pendingS' => 'استلمنا طلبك {ref}', 'pendingB' => 'شكرًا لك. طلب الحجز في انتظار تأكيد الفندق. فريق الحجز يراجع الغرف المتاحة ويرد عليك. لا يُخصم شيء الآن.',
        'confirmedS' => 'تم تأكيد حجزك {ref}', 'confirmedB' => 'خبر سعيد: الفندق أكّد حجزك.',
        'confirmedPay' => 'اخترت الدفع أونلاين. استخدم هذا الزر للدفع بالبطاقة بالجنيه:', 'payBtn' => 'ادفع الآن', 'confirmedArr' => 'الدفع في الاستقبال عند الوصول.',
        'declinedS' => 'بخصوص طلبك {ref}', 'declinedB' => 'نعتذر: لم يتمكن الفندق من قبول هذا الطلب. يسعدنا أن تجرّب تواريخ أخرى أو تتواصل معنا.',
        'cancelledS' => 'تم إلغاء حجزك {ref}', 'cancelledB' => 'تم إلغاء هذا الحجز. تواصل معنا إن كان ذلك خطأ.',
        'paidS' => 'استلمنا الدفع للحجز {ref}', 'paidB' => 'استلمنا دفعتك. نراك في شرم الشيخ.',
        'view' => 'اعرض حجزك', 'contact' => 'الهاتف {phone} · واتساب {wa}',
    ],
];

function esc(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

/** The request as a two-column table. */
function requestTable(array $r, string $lang): string
{
    $T = MAIL_T[$lang];
    $rows = [
        [$T['ref'], $r['ref']],
        [$T['guest'], $r['name']],
        [$T['phone'], $r['phone']],
        [$T['email'], $r['email']],
        [$T['room'], $r["room_$lang"]],
        [$T['in'], $r['d_in']],
        [$T['out'], $r['d_out']],
        [$T['stay'], "{$r['nights']} {$T['nights']} × {$r['rooms']} {$T['rooms']}"],
        [$T['plan'], $T[$r['plan']]],
        [$T['party'], "{$r['adults']} {$T['adults']} · {$r['children']} {$T['children']}"],
        [$T['bed'], $T[$r['bed']]],
        [$T['arrival'], $T[$r['arrival']]],
        [$T['pay'], $T[$r['pay'] === 'online' ? 'payOnline' : 'payArrival']],
        [$T['total'], number_format((int) $r['total']) . ' ' . $T['egp']],
        [$T['note'], $r['note']],
    ];
    $html = '';
    foreach ($rows as [$k, $v]) {
        if ((string) $v === '') continue;
        $html .= '<tr><td style="padding:6px 12px;color:#1553b6;font-weight:bold;white-space:nowrap;border-bottom:1px solid #dde6f5">' . esc($k) . '</td><td style="padding:6px 12px;border-bottom:1px solid #dde6f5">' . nl2br(esc((string) $v)) . '</td></tr>';
    }
    return '<table style="border-collapse:collapse;margin:16px 0">' . $html . '</table>';
}

function mailShell(string $lang, string $inner): string
{
    $dir = $lang === 'ar' ? 'rtl' : 'ltr';
    $name = esc((string) (setting('name')[$lang] ?? 'Regency Royal Sharm'));
    return "<div dir=\"$dir\" style=\"font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#10203f;max-width:600px\"><h2 style=\"color:#1553b6;margin:0 0 12px\">$name</h2>$inner</div>";
}

function mineUrl(array $r): string
{
    return siteUrl() . ($r['lang'] === 'en' ? '/en' : '') . '/booking/?ref=' . rawurlencode($r['ref']);
}

function payUrl(array $r): string
{
    return siteUrl() . '/api/pay?ref=' . rawurlencode($r['ref']) . '&k=' . $r['pay_token'];
}

/** Email the guest about their request, in their language. Does nothing if they gave no email. */
function mailGuest(array $r, string $kind): void
{
    if ($r['email'] === '') return;
    $lang = $r['lang'] === 'en' ? 'en' : 'ar';
    $T = MAIL_T[$lang];
    $c = setting('contact', []);
    $inner = '<p>' . esc($T[$kind . 'B']) . '</p>';
    if ($r['hotel_note'] !== '' && in_array($kind, ['confirmed', 'declined'], true)) $inner .= '<p><b>' . esc($T['hotelNote']) . ':</b> ' . nl2br(esc($r['hotel_note'])) . '</p>';
    if ($kind === 'confirmed') {
        if ($r['pay'] === 'online' && !$r['paid'] && onlinePayOn()) {
            $inner .= '<p>' . esc($T['confirmedPay']) . '</p><p><a href="' . esc(payUrl($r)) . '" style="display:inline-block;background:#1553b6;color:#fff;padding:12px 26px;text-decoration:none;font-weight:bold">' . esc($T['payBtn']) . '</a></p>';
        } elseif ($r['pay'] === 'arrival') {
            $inner .= '<p>' . esc($T['confirmedArr']) . '</p>';
        }
    }
    $inner .= requestTable($r, $lang);
    $inner .= '<p><a href="' . esc(mineUrl($r)) . '">' . esc($T['view']) . '</a></p>';
    $inner .= '<p style="color:#5b6b8a">' . esc(strtr($T['contact'], ['{phone}' => $c['phone'] ?? '', '{wa}' => $c['whatsapp'] ?? ''])) . '</p>';
    sendMail($r['email'], str_replace('{ref}', $r['ref'], $T[$kind . 'S']), mailShell($lang, $inner), (string) ($c['bookingEmail'] ?? ''));
}

/** Email the booking team. Kinds: new, cancelled (by the guest), paid. */
function mailHotel(array $r, string $kind): void
{
    $to = (string) (setting('contact', [])['bookingEmail'] ?? '');
    if ($to === '') return;
    $subject = [
        'new' => "طلب حجز جديد {$r['ref']} · {$r['name']} · {$r['d_in']}",
        'cancelled' => "النزيل ألغى الطلب {$r['ref']} · {$r['name']}",
        'paid' => "تم الدفع أونلاين للحجز {$r['ref']} · " . number_format((int) $r['total']) . ' جنيه',
    ][$kind];
    $lead = [
        'new' => 'طلب حجز جديد من الموقع. راجع الغرف المتاحة ثم أكّد الطلب أو اعتذر من لوحة التحكم.',
        'cancelled' => 'ألغى النزيل هذا الطلب من الموقع.',
        'paid' => 'دفع النزيل قيمة هذا الحجز أونلاين عبر Paymob.',
    ][$kind];
    $inner = '<p>' . esc($lead) . '</p>' . requestTable($r, 'ar') . '<p><a href="' . esc(siteUrl() . '/admin/') . '" style="display:inline-block;background:#1553b6;color:#fff;padding:12px 26px;text-decoration:none;font-weight:bold">افتح لوحة التحكم</a></p>';
    sendMail($to, $subject, mailShell('ar', $inner), $r['email']);
}
