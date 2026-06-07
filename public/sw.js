// ORCA service worker — enables install-to-home-screen and light offline.
//
// Strategy: NETWORK-FIRST EVERYWHERE for same-origin GETs so every reload
// pulls the freshest bundle when online. Cache is purely an offline fallback
// (the most recent successful network response is mirrored into it). API calls
// and cross-origin (Supabase media) always go straight to the network. This is
// safer than stale-while-revalidate during active development — there's no
// "saw the old code one more time after a redeploy" window.

const CACHE = "orca-v5";
const OFFLINE_URL = "/";

// --- Offline request outbox (Background Sync) ------------------------------
// Mirrors lib/requestQueue.ts. On the `sync` event (fired by the browser when
// connectivity returns, Chromium only) we replay any queued help requests.
// /api/requests is idempotent, so replaying a request can never duplicate it.
const QUEUE_DB = "orca-offline";
const QUEUE_STORE = "request-queue";
const SYNC_TAG = "orca-flush-requests";

function openQueueDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QUEUE_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function flushQueuedRequests() {
  let db;
  try {
    db = await openQueueDB();
  } catch {
    return;
  }
  const all = await new Promise((resolve) => {
    const tx = db.transaction(QUEUE_STORE, "readonly");
    const r = tx.objectStore(QUEUE_STORE).getAll();
    r.onsuccess = () => resolve(r.result || []);
    r.onerror = () => resolve([]);
  });
  for (const item of all) {
    let res;
    try {
      res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.session),
      });
    } catch {
      break; // still offline — leave the rest queued for the next sync
    }
    // Retry later on transient errors (5xx/429/408); drop terminal 4xx so a bad
    // item can't block the queue. Delete on success and on terminal failure.
    const retryable = res.status >= 500 || res.status === 408 || res.status === 429;
    if (!res.ok && retryable) break;
    await new Promise((resolve) => {
      const tx = db.transaction(QUEUE_STORE, "readwrite");
      tx.objectStore(QUEUE_STORE).delete(item.id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) event.waitUntil(flushQueuedRequests());
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Never intercept API routes or cross-origin requests (e.g. Supabase media,
  // OpenAI) — they must hit the network.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Page navigations: network-first, fall back to the cached shell offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Only cache a genuine, successful, same-origin page — never a 404/500
          // or redirect, which would otherwise poison the offline shell.
          if (res && res.ok && res.status === 200 && res.type === "basic" && !res.redirected) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // Static assets: NETWORK-FIRST. Every fetch goes to the network; the response
  // is mirrored into the cache only so the page can still load when offline.
  // No more "I just got served the cached old chunk while the network update
  // happened in the background and won't show until next reload."
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(request).then((r) => r || Response.error()))
  );
});
