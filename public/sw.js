// ORCA service worker — enables install-to-home-screen and light offline.
//
// Strategy: NETWORK-FIRST EVERYWHERE for same-origin GETs so every reload
// pulls the freshest bundle when online. Cache is purely an offline fallback
// (the most recent successful network response is mirrored into it). API calls
// and cross-origin (Supabase media) always go straight to the network. This is
// safer than stale-while-revalidate during active development — there's no
// "saw the old code one more time after a redeploy" window.
// On activate, the SW also force-reloads every controlled window via
// client.navigate(), so installs that pre-date the client-side
// controllerchange listener still pick up new builds.

const CACHE = "orca-v8";
const OFFLINE_URL = "/";

// Dedicated, version-independent cache for the Mapbox basemap (dengue map).
// Kept separate from CACHE so bumping the app version never purges already-
// downloaded tiles — they stay available offline.
const MAP_CACHE = "orca-mapbox-v1";

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
  event.waitUntil((async () => {
    // 1. Delete any cache whose key doesn't match the current CACHE version.
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE && k !== MAP_CACHE).map((k) => caches.delete(k)));

    // 2. Take control of every existing client immediately (so the navigate
    //    call below targets clients this SW is now the controller of).
    await self.clients.claim();

    // 3. Server-side force-reload of every controlled window. This is the
    //    only way to update installs from BEFORE the controllerchange
    //    auto-reload listener existed in client code — those clients won't
    //    react to a controller swap on their own, so we push them.
    //    Wrapped in try/catch per client because navigate() can reject in
    //    some browsers (Firefox, Safari) where it isn't supported.
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await Promise.all(clients.map(async (client) => {
      try {
        if (typeof client.navigate === "function") {
          await client.navigate(client.url);
        } else {
          // Fallback: postMessage and let any controllerchange listener pick it up.
          client.postMessage({ type: "SW_ACTIVATED" });
        }
      } catch {
        /* navigation refused (e.g. cross-origin redirect target) — ignore */
      }
    }));
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Mapbox basemap (dengue map): CACHE-FIRST into a dedicated cache so tiles
  // viewed while online still render when offline or on a flaky connection.
  // Runtime caching only — no bulk pre-download. ClusterMapLive requests tiles
  // with crossOrigin, so these responses are CORS (not opaque) and safe to
  // cache; a basemap is effectively static, so cache-first is fine and also
  // trims repeat Mapbox requests.
  if (url.hostname === "api.mapbox.com" || url.hostname.endsWith(".tiles.mapbox.com")) {
    event.respondWith(
      caches.open(MAP_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        try {
          const res = await fetch(request);
          if (res && res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          return hit || Response.error();
        }
      })
    );
    return;
  }

  // Never intercept API routes or other cross-origin requests (e.g. Supabase
  // media, OpenAI) — they must hit the network.
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
