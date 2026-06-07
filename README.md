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
