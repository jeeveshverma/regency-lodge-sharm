<?php
/**
 * Copy this file to api/config.php on the server and fill it in. It is never served to visitors.
 */
return [
    // MySQL / MariaDB database (Hostinger: hPanel > Databases)
    'db' => ['host' => 'localhost', 'name' => '', 'user' => '', 'pass' => ''],

    // Address of the site, without a slash at the end. Used in emails and payment links.
    'site_url' => 'https://example.com',

    // A long random text. Needed once, to create the first dashboard user at /admin/.
    'install_key' => 'change-me',

    // Outgoing email. Hostinger mailbox: host smtp.hostinger.com, port 465, secure 'ssl'.
    // secure: 'ssl' (port 465), 'tls' (port 587) or '' (none). Empty host = use the server's own mail().
    'mail' => ['host' => 'smtp.hostinger.com', 'port' => 465, 'secure' => 'ssl', 'user' => '', 'pass' => '', 'from' => ''],

    // Paymob. mode: 'off' (no online payment), 'live' (real account; test keys also go here), 'fake' (local test page).
    // Keys are in the Paymob dashboard under Settings > Account info; integration_id is the card integration.
    // In Paymob, set the integration's "Transaction processed callback" to  {site_url}/api/paymob/callback
    'paymob' => ['mode' => 'off', 'secret_key' => '', 'public_key' => '', 'integration_id' => 0, 'hmac' => ''],

    'debug' => false,
];
