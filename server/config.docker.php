<?php
/** Local test setup (docker compose). Not for a real server. */
return [
    'db' => ['host' => 'db', 'name' => 'regency', 'user' => 'regency', 'pass' => 'regency'],
    'site_url' => 'http://127.0.0.1:8788',
    'install_key' => 'local-install-key',
    'mail' => ['host' => 'mail', 'port' => 1025, 'secure' => '', 'user' => '', 'pass' => '', 'from' => 'reservations@regency.test'],
    'paymob' => ['mode' => 'fake', 'hmac' => 'local-test-hmac'],
    'debug' => true,
    'no_limits' => true, // the test scripts send many requests from one address
];
