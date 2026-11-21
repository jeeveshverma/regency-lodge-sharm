# Regency Lodge, Sharm El Sheikh (ريجينسي لودج)

Website and booking system for the lodge. Arabic at the root, English under `/en/`. Astro, built in the
same way as `giza-pyramids-view-guest-house`.

## Design (version 2, 2026-11-21)

A travel poster in the lodge's own colours (whitewash, the cobalt of its railings, pool turquoise, one sun
yellow; Lalezar for display type). The page runs from the lodge wall down to the reef: cobalt wall with the
key board hanging on it and the price on a sun, the pool photo, "Sharm, today" (sunset, daylight, sea
temperature), prices and the bill, the room, the lodge drawn at the waterline, then under the water "a day
from the lodge door" with fish and coral. Pitch: "Sleep here. Spend the rest on the sea." Version 1 (quiet
white layout) is the git tag `v1`.

## State

Steps 1 and 2 of 4: the home page, the booking page (details, review, confirmation with the booking
number) and "My booking" (find by number + phone, cancel).

**There is no backend yet.** `src/lib/api.ts` keeps bookings in the visitor's own browser
(localStorage) on top of sample availability (`src/lib/avail.ts`). The hotel learns of a booking only
when the guest presses "Send the booking on WhatsApp" on the confirmation page. The real backend
(Cloudflare Pages + D1, or the VPS: not decided) replaces the four functions in `api.ts`; the pages
stay as they are. Then: the admin dashboard. Guests pay at the hotel.

## Run

    npm install
    npm run build && npx astro preview --port 4341 --host 127.0.0.1
    node scripts/shots.mjs <outDir>        # screenshots, both languages, phone and desktop
    node scripts/flow.mjs                  # home page prices and key board
    node scripts/booktest.mjs              # the booking path end to end (ENGINE=webkit for Safari's engine)

## Facts and where they come from

Owner (WhatsApp, 2026-11-21): phone 01036654930, email, standard double room (double or twin), air
conditioning, minibar, TV, pool view; EGP 1,500 room only / 1,600 breakfast / 1,800 breakfast and
dinner, valid until 21.12.2026. All in `src/data/site.ts`.

Tripadvisor listing "Regency Hotel Sharm" (d34354783): address (El Hadaba, Magles El-Madina St), walking
times, airport distance, and the three photos (Booking.com partner photos, watermark strips cropped).

## To confirm with the owner

- "20" = 20 rooms; "2\2" = 2 adults + 2 children (shown on the site as such)
- WhatsApp number (assumed the same as the phone)
- Check-in / check-out times (the site shows 14:00 / 12:00 as placeholders), cancellation rule
- Same price every night until 21.12.2026?
- Own photos (the room photos here are poor) and a logo
- Domain name
