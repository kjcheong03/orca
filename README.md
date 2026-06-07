# ORCA — community health companion

ORCA is a phone app for caregivers looking after elderly or vulnerable people in
Singapore during health threats like **COVID-19** and **dengue**. It pulls
together public health information and turns it into plain, personalised advice
for the person you care for

This repo is a **frontend-only prototype** (no backend) built for a hackathon

---

## What's in the app

The app has **4 tabs**:

1. **Info** — the home screen.
   - Pick a date and switch between **COVID** or **Dengue**.
   - ORCA shows the current situation using **real Singapore government data**
     (data.gov.sg) and gives **tailored suggestions** based on the care
     recipient's health profile (e.g. extra caution for diabetes).
   - For dengue, a **map** shows nearby clusters around the person's home.
   - A friendly **mascot** reacts to the risk level (calm or concerned).

2. **Community** — a simple, Google-Forms-style page to **request non-emergency
   help** (e.g. medication collection, groceries) that gets routed to community
   partners.

3. **Contacts** — emergency contacts with one-tap calling, a **care profile**
   card, an **SMS alert** shortcut, and a quick **call ambulance (995)** button.

4. **Profile** — the care recipient's details: conditions, emergency medicine,
   and measurements.

Other features:
- **6 languages** (English, Bahasa Indonesia, Tagalog, Burmese, Chinese, Malay),
  so domestic helpers and family can use it comfortably.
- **Responsive** — sidebar navigation on desktop, bottom navigation on mobile.

---

## Tech

- **Next.js 15** (App Router) + **React 19** + **TypeScript**.
- **Tailwind CSS v4** for styling
- **framer-motion** for the mascot and animations
- **Leaflet + Mapbox** for the dengue cluster map
- Live public data from **data.gov.sg** (COVID stats + dengue clusters)

---

## Running it

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>

The dengue map needs a Mapbox token. Copy `.env.example` to `.env.local` and add
your own:

```
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token
```

---

## Offline support (PWA)

ORCA installs to the home screen and keeps working without a connection. The rule
is simple: **on-device and native things keep working; network/AI things degrade
gracefully.**

**Works offline**

- The whole app shell, all bundled situation data, and the care profile, emergency
  contacts, one-tap **call 995**, and **SMS alert** (composing + sending are native).
- A persistent **"You're offline"** banner so the caregiver knows live features are
  paused.
- The dengue map falls back from live Mapbox tiles to a tile-free **SVG cluster
  map** (the cluster data is bundled).
- **Last-known** authority broadcasts and AI "today" suggestions are cached and
  shown (labelled as saved), instead of going blank.
- Community help requests submitted offline are saved to a local **outbox**
  ("Waiting to send") and **auto-sent when the connection returns** — safe to replay
  because `/api/requests` is idempotent on the request id. On Chromium this also uses
  Background Sync; elsewhere (e.g. iOS) it flushes on reconnect / next open.

**Degrades when offline** (needs the network, shown disabled with a clear note):
Ask ORCA chat, voice transcription, alert translation, text-to-speech, OneMap
postal lookup (you can still type the address), and live Mapbox tiles.

**Caveats** (inherent to PWAs)

- **The first visit must be online** — the service worker can only serve what it has
  cached at least once.
- After a **redeploy**, do a fresh online load before relying on offline again, and
  bump `CACHE` in [`public/sw.js`](public/sw.js) so clients pick up the new build.
- The service worker only registers in a **production** build (`npm run build &&
  npm start`), not `npm run dev`. To test offline in another mode, set
  `NEXT_PUBLIC_ENABLE_SW=1` at build time.

**Validating it** — with a production server running on `:3000`:

```bash
node scripts/offline-check.mjs   # drives a real browser offline and asserts the above
```
