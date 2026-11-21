# Regency Lodge, Sharm El Sheikh (ريجينسي لودج)

Website and booking system for the lodge. Arabic at the root, English under `/en/`. Astro, built in the
same way as `giza-pyramids-view-guest-house`.

## State

Step 1 of 4: the home page as a design preview. The key board, the three prices and the bill work, but
**availability is sample data** (`src/lib/avail.ts`) and "Book now" goes nowhere yet.

Next: booking pages, then the admin dashboard, then the Cloudflare Pages + D1 backend
(`GET /api/availability` replaces `freeRooms`). Guests pay at the hotel.

## Run

    npm install
    npm run build && npx astro preview --port 4341 --host 127.0.0.1
    node scripts/shots.mjs <outDir>        # screenshots, both languages, phone and desktop

## Facts and where they come from

Owner (WhatsApp, 2026-11-21): phone 01036654930, email, standard double room (double or twin), air
conditioning, minibar, TV, pool view; EGP 1,500 room only / 1,600 breakfast / 1,800 breakfast and
dinner, valid until 21.12.2026. All in `src/data/site.ts`.

Tripadvisor listing "Regency Hotel Sharm" (d34354783): address (El Hadaba, Magles El-Madina St), walking
times, airport distance, and the three photos (Booking.com partner photos, watermark strips cropped).

## To confirm with the owner

- "20" = 20 rooms; "2\2" = 2 adults + 2 children (shown on the site as such)
- WhatsApp number (assumed the same as the phone)
- Check-in / check-out times, cancellation rule
- Same price every night until 21.12.2026?
- Own photos (the room photos here are poor) and a logo
- Domain name
