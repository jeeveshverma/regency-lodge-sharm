# Regency Royal Sharm, Sharm El Sheikh (ريجينسي رويال شرم)

Website and reservation requests for the hotel (first briefed as Regency Lodge; the repo keeps that name). Arabic at the root, English under `/en/`. Astro, built in the
same way as `giza-pyramids-view-guest-house`.

## Design (version 2, 2026-11-21)

A travel poster in the lodge's own colours (whitewash, the cobalt of its railings, pool turquoise, one sun
yellow; Lalezar for display type). The page runs from the lodge wall down to the reef: cobalt wall with the
key board hanging on it and the price on a sun, the pool photo, "Sharm, today" (sunset, daylight, sea
temperature), prices and the bill, the room, the lodge drawn at the waterline, then under the water "a day
from the lodge door" with fish and coral. Pitch: "Sleep here. Spend the rest on the sea." Version 1 (quiet
white layout) is the git tag `v1`.

## State

**Hotel's requirements (2026-11-28).** The hotel runs reservations by hand in Excel, so the site takes
reservation *requests*, not instant bookings. Branding is "Regency Royal Sharm" with their approved logo.
They want: Arabic + English, fast and light; accurate room categories, photos, facilities and prices; a
request form that reaches the booking team; the guest told the request is pending hotel confirmation; the
team confirms or declines by hand; payment on arrival or online through Paymob in EGP, online only after
the hotel confirms; a simple dashboard for requests, prices, photos and content; deployment on their
existing domain with full access and ownership.

Done on the public pages: the name, the request flow (details, review, "pending hotel confirmation" with a
request number), the payment choice, and "My reservation" (status, cancel). The key board in the hero is a
drawing only: one yellow key per room asked for, no availability.

**There is no backend yet.** `src/lib/api.ts` keeps requests in the visitor's own browser (localStorage).
The hotel learns of a request only when the guest presses "Send the request on WhatsApp". The backend
replaces the three functions in `api.ts` and adds: email to the booking team and to the guest, confirm /
decline, the Paymob payment link after confirmation, and the dashboard. Hosting is not decided.

Still needed from the hotel: the logo file, the room categories with prices, their domain and hosting
access, Paymob keys, the booking team's email address.

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
Twelve more photos (garden, pool, restaurant, terrace at night, bathroom, poolside, six rooms) come from the
lodge's two Google listings ("فندق ريجينسى لودج شرم" and "Regency Hotel Sharm"): visitor and owner uploads,
chosen only where the blue-and-white building is recognisable. To be replaced by the owner's own photos.
Eight photos sent on WhatsApp on 2026-11-23 (whole pool, flowers, courtyard, slides, terrace chairs, window view,
pool from above, three-bed room): the sharp ones out of fourteen; logo and edit marks cropped off.
Three more (balcony view, blue door, walkway) and the check-in/out times (14:00 / 12:00) and beach walk (Sharm El Maya
Bay, 14 min) come from the lodge's Booking.com listing. Guest quotes in `REVIEWS` (`src/data/site.ts`) are real
Google reviews from the "Regency Hotel Sharm" listing, shortened; the Arabic is a translation.

## To confirm with the owner

- "20" = 20 rooms; "2\2" = 2 adults + 2 children (shown on the site as such)
- WhatsApp number (assumed the same as the phone)
- Check-in / check-out times (the site shows 14:00 / 12:00 as placeholders), cancellation rule
- Same price every night until 21.12.2026?
- Own photos (the room photos here are poor) and a logo
- Domain name
