# Backend: reservation requests, emails, Paymob, dashboard

PHP 8.1+ and MySQL/MariaDB, no libraries. Runs on shared hosting (Hostinger) or any PHP server.

## Try it locally

    npm run assemble && docker compose up -d --build
    node scripts/servertest.mjs        # creates the dashboard user on first run, then tests everything

- Site http://127.0.0.1:8788/ · dashboard http://127.0.0.1:8788/admin/ (owner@regency.test / local-pass-123)
- Emails are caught at http://127.0.0.1:8026/ and go nowhere else.
- Online payment is a test page (`paymob.mode = fake` in `server/config.docker.php`).
- Start again from nothing: `docker compose down -v`, empty `deploy/uploads/`, `docker compose up -d`.

## Put it on the hotel's hosting

1. `SITE=https://their-domain npm run assemble`, then upload the contents of `deploy/` to the web root (`public_html`).
2. Create a MySQL database and a mailbox in the hosting panel.
3. Copy `api/config.sample.php` to `api/config.php` and fill in the database, `site_url`, a long random `install_key`, and the mailbox.
4. Open `/admin/`, choose "First time? Create the first user", enter the install key. This creates the tables and loads the first content.
5. In the dashboard: Settings (booking team email, phone, WhatsApp, logo), then Rooms and prices.
6. Paymob: put the keys in `api/config.php` with `mode => 'live'`, and in Paymob set the card integration's
   "Transaction processed callback" to `https://their-domain/api/paymob/callback`.
   The Paymob code follows their Intention API docs but has not been run against a real account yet:
   make one test-card payment before announcing it.

`uploads/` (photos, logo) and `api/config.php` are the only things on the server that an update must not overwrite.
