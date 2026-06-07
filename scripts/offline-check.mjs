// Offline PWA validation — drives a real Chromium against the production server.
// Run:  node scripts/offline-check.mjs   (server must be on http://localhost:3000)
//
// Hermetic: POST /api/requests is mocked so the reconnect-flush never writes to
// the shared Supabase demo backend; the queued fixture uses a unique id per run.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const QID = `req-offline-${Date.now()}`;
const results = [];
const ok = (name, pass, info = "") => {
  results.push({ name, pass, info });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${info ? `  — ${info}` : ""}`);
};

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(BASE, { cache: "no-store" });
      if (r.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("server never became ready on " + BASE);
}

async function main() {
  console.log("waiting for server…");
  await waitForServer();
  console.log("launching chromium…");
  const browser = await chromium.launch({ timeout: 60000 });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);

  // 1) Online load + activate the SW, then reload so it controls + caches the shell.
  console.log("loading page (online)…");
  await page.goto(BASE, { waitUntil: "load" });
  const swReady = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return "no-api";
    try {
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, rej) => setTimeout(() => rej(new Error("t")), 15000)),
      ]);
      return "ready";
    } catch {
      return "not-ready";
    }
  });
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(800);
  const swControlled = await page.evaluate(() => !!navigator.serviceWorker?.controller);
  ok("Service worker controls the page", swControlled, `ready=${swReady}`);

  // 2) Seed the IndexedDB outbox with one queued request (unique id per run).
  await page.evaluate(async (id) => {
    const session = {
      id,
      careRecipientName: "Offline Test",
      caregiverName: "Tester",
      contactNumber: "90000000",
      contactMethod: "Phone call",
      linkedTopic: "Dengue alert",
      createdAt: new Date().toISOString(),
      overallStatus: "Pending",
      tasks: [
        {
          id: "welfare",
          fulfilment: "partner",
          supportType: "welfare",
          selectedSubtypes: ["Check-in"],
          details: {},
          primaryOrganisationId: "",
          fallbackOrganisationIds: [],
          status: "Pending",
        },
      ],
    };
    await new Promise((resolve, reject) => {
      const req = indexedDB.open("orca-offline", 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("request-queue"))
          db.createObjectStore("request-queue", { keyPath: "id" });
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("request-queue", "readwrite");
        tx.objectStore("request-queue").put({ id: session.id, session, queuedAt: new Date().toISOString() });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }, QID);

  // 3) Go offline and reload — everything below is served by the SW with no network.
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);

  // a) The app shell renders offline at all.
  const shell = await page.locator("body").innerText().catch(() => "");
  ok("App shell renders offline", /ORCA|Ask|Overview|Info|COVID|Dengue/i.test(shell), shell.slice(0, 36).replace(/\n/g, " "));

  // b) Offline banner is visible.
  const banner = page.getByText(/emergency info and contacts still work/i);
  ok("Offline banner shown", await banner.isVisible({ timeout: 4000 }).catch(() => false));

  // c) Dengue map falls back to the tile-free SVG offline.
  try {
    await page.getByRole("button", { name: /COVID-19/ }).first().click();
    await page.getByRole("option", { name: /Dengue/ }).first().click();
    await page.waitForTimeout(500);
    const svg = await page.locator('svg[aria-label="Map of dengue clusters near home"]').count();
    const leaflet = await page.locator(".leaflet-container").count();
    ok("Dengue SVG fallback renders offline (no Leaflet tiles)", svg > 0 && leaflet === 0, `svg=${svg} leaflet=${leaflet}`);
  } catch (e) {
    ok("Dengue SVG fallback renders offline (no Leaflet tiles)", false, String(e).slice(0, 80));
  }

  // d) Ask ORCA answers locally offline (no network call).
  try {
    await page.getByRole("button", { name: "Ask ORCA" }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder(/Ask/i).first().fill("Should she go out today?");
    await page.getByRole("button", { name: "Send" }).first().click();
    const reply = page.getByText(/I can't answer right now|need an internet connection/i);
    ok("Ask ORCA shows offline reply (no crash)", await reply.first().isVisible({ timeout: 4000 }).catch(() => false));
    await page.keyboard.press("Escape").catch(() => {});
  } catch (e) {
    ok("Ask ORCA shows offline reply (no crash)", false, String(e).slice(0, 80));
  }

  // e) The queued (offline) request appears in Community with a "Waiting to send" badge.
  try {
    await page.getByRole("button", { name: /Support/i }).first().click();
    await page.waitForTimeout(1200);
    const waiting = page.getByText(/Waiting to send/i);
    const vis = await waiting.first().isVisible({ timeout: 6000 }).catch(() => false);
    if (!vis) {
      const idbIds = await page.evaluate(
        () =>
          new Promise((res) => {
            const r = indexedDB.open("orca-offline", 1);
            r.onsuccess = () => {
              const db = r.result;
              const g = db.transaction("request-queue", "readonly").objectStore("request-queue").getAll();
              g.onsuccess = () => res((g.result || []).map((x) => x.id));
              g.onerror = () => res(["getAllErr"]);
            };
            r.onerror = () => res(["openErr"]);
          }),
      );
      console.log("  DEBUG idbIds=", JSON.stringify(idbIds), "waitingCount=", await page.getByText(/Waiting to send/i).count());
    }
    ok("Queued request shows 'Waiting to send'", vis);
  } catch (e) {
    ok("Queued request shows 'Waiting to send'", false, String(e).slice(0, 80));
  }

  // f) Back online: the outbox flushes (POST mocked) and the banner clears.
  // Register the POST mock NOW (not earlier) — route.fulfill bypasses the offline
  // emulation, so mocking it during the offline phase would let the offline flush
  // "succeed" and empty the queue before step (e). GET still hits the real route.
  await context.route("**/api/requests", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, id: "mock" }) });
    }
    return route.fallback();
  });
  await context.setOffline(false);
  await page.waitForTimeout(2000);
  const bannerGone = !(await page.getByText(/emergency info and contacts still work/i).isVisible().catch(() => false));
  ok("Offline banner clears when back online", bannerGone);
  const remaining = await page.evaluate(
    () =>
      new Promise((res) => {
        const r = indexedDB.open("orca-offline", 1);
        r.onsuccess = () => {
          const db = r.result;
          const c = db.transaction("request-queue", "readonly").objectStore("request-queue").count();
          c.onsuccess = () => res(c.result);
          c.onerror = () => res(-1);
        };
        r.onerror = () => res(-2);
      }),
  );
  ok("Outbox flushes on reconnect (queue empties)", remaining === 0, `remaining=${remaining}`);

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log("FAILED: " + failed.map((f) => f.name).join("; "));
    process.exit(1);
  }
}

const watchdog = setTimeout(() => {
  console.error("WATCHDOG: timed out after 150s — forcing exit");
  process.exit(1);
}, 150000);
watchdog.unref?.();

main()
  .then(() => clearTimeout(watchdog))
  .catch((e) => {
    console.error("offline-check crashed:", e);
    process.exit(1);
  });
