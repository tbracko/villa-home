# Villa Home — Booking Site

A direct-booking website for **Villa Home** (Kerobokan, Bali) with a luxury joglo
theme, photo gallery, and a **live availability calendar synced from Airbnb**.
Guests browse open dates and send booking requests by WhatsApp or email — no
booking fees, no third-party commission.

---

## 1. Run it locally

```bash
cd villa-home-site
npm install
npm start
```

Then open **http://localhost:3000**

---

## 2. Configure it (`.env`)

Open the `.env` file and replace the placeholders. The most important ones:

| Setting | What it does |
|---|---|
| `AIRBNB_ICAL_URL` | **Turns on live availability.** See step 3. |
| `WHATSAPP_NUMBER` | Where booking requests are sent (e.g. `+6281…`). |
| `NOTIFICATION_EMAIL` | Email used for the "Request via Email" button. |
| `NIGHTLY_RATE` | Price per night shown in the estimate. |
| `CURRENCY` | `usd`, `eur`, `aud`, `gbp`, `idr`, `sgd`. |
| `CLEANING_FEE` | Optional one-off fee added to the estimate. |
| `MIN_NIGHTS` | Minimum stay (default 2). |
| `MAX_GUESTS` | Caps the guest stepper. |
| `AIRBNB_URL` | Public listing link for the "View on Airbnb" button. |

The site reads these live — just restart `npm start` after editing.

---

## 3. Connect the Airbnb calendar (live sync)

The calendar blocks out dates that are already booked on Airbnb, automatically.

1. On Airbnb: **Menu → Listings → (select Villa Home) → Calendar**
2. Open **Availability → Connect to another website → Export calendar**
3. Copy the `.ics` link (looks like
   `https://www.airbnb.com/calendar/ical/XXXXXXXX.ics?s=…`)
4. Paste it into `.env` as `AIRBNB_ICAL_URL=…`
5. Restart the server.

Availability is cached for 15 minutes, so changes on Airbnb appear within ~15 min.
Until this link is set, the calendar simply shows every date as available and a
small "Live calendar not yet connected" note appears.

> Tip: if you also want **two-way** blocking (a booking made here also blocks
> Airbnb), import this site's dates back into Airbnb, or keep Airbnb as the single
> source of truth and confirm direct bookings there.

---

## 4. Photos

All images live in `public/images/`. To swap one, replace the file keeping the
same name (ideal size ~1440×960, JPEG). The gallery order is defined in the
`PHOTOS` array near the bottom of `public/index.html`.

---

## 5. Deploy

It's a standard Node/Express app. Any of these work well:

- **Render / Railway / Fly.io** — connect the repo, set the `.env` variables in
  the dashboard, start command `npm start`.
- **A small VPS** — `npm install`, run with `pm2 start server.js`, put Nginx in
  front for HTTPS and your domain.

Set `SITE_URL` to your real domain once live.
