// Offline outbox for community help requests. When a request is submitted with
// no connection, it's stored in IndexedDB and replayed when the device comes
// back online — on the `online` event from the app, and via Background Sync
// from the service worker where supported (Chromium). Replay is SAFE because
// /api/requests is idempotent (keyed on the session id), so a request that gets
// posted twice (app + SW racing, or a retry) can never create a duplicate.
//
// IndexedDB (not localStorage) so the service worker can read the same queue.

import type { RequestSession } from "./contract";

const DB_NAME = "orca-offline";
const DB_VERSION = 1;
const STORE = "request-queue";

/** Fired on the window whenever the queue changes, so the UI can refresh. */
export const QUEUE_CHANGED_EVENT = "orca-queue-changed";

/** Background Sync tag — mirrored in public/sw.js. */
export const SYNC_TAG = "orca-flush-requests";

interface QueuedRequest {
  id: string; // = session.id (the server idempotency key)
  session: RequestSession;
  queuedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = fn(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
      }),
  );
}

function notifyChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(QUEUE_CHANGED_EVENT));
}

/** Add (or replace, by id) a request in the offline outbox. */
export async function enqueueRequest(session: RequestSession): Promise<void> {
  const entry: QueuedRequest = { id: session.id, session, queuedAt: new Date().toISOString() };
  await run("readwrite", (s) => s.put(entry));
  notifyChanged();
}

/** All requests waiting to be sent (so the UI can show them immediately). */
export async function queuedRequests(): Promise<RequestSession[]> {
  try {
    const all = await run<QueuedRequest[]>("readonly", (s) => s.getAll() as IDBRequest<QueuedRequest[]>);
    return all.map((q) => q.session);
  } catch {
    return [];
  }
}

/**
 * Try to POST every queued request, removing each one that succeeds. A transient
 * failure (network down / 5xx / 429) stops the run and keeps the rest queued for
 * next time; a terminal client error (4xx — e.g. a malformed payload) drops that
 * one item so it can't block everything queued behind it forever. Returns the
 * number sent. Concurrent callers (shell + tab + SW) coalesce onto one run.
 */
let inFlight: Promise<number> | null = null;
export function flushQueue(): Promise<number> {
  if (inFlight) return inFlight;
  inFlight = doFlush().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Retryable = keep the item and try again later; otherwise it's a dead letter. */
function isRetryable(status: number): boolean {
  return status >= 500 || status === 408 || status === 429;
}

async function doFlush(): Promise<number> {
  let queued: QueuedRequest[];
  try {
    queued = await run<QueuedRequest[]>("readonly", (s) => s.getAll() as IDBRequest<QueuedRequest[]>);
  } catch {
    return 0;
  }

  let flushed = 0;
  for (const item of queued) {
    let res: Response;
    try {
      res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.session),
      });
    } catch {
      break; // network down — keep the rest for the next attempt
    }
    if (res.ok) {
      await run("readwrite", (s) => s.delete(item.id));
      flushed++;
    } else if (isRetryable(res.status)) {
      break; // transient server problem — stop, retry the whole queue later
    } else {
      // Terminal (4xx): this request will never succeed. Drop it so it doesn't
      // wedge the queue, and keep going.
      await run("readwrite", (s) => s.delete(item.id));
    }
  }

  if (flushed) notifyChanged();
  return flushed;
}

/** Ask the service worker to flush the queue in the background when supported. */
export async function requestBackgroundSync(): Promise<void> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (typeof window === "undefined" || !("SyncManager" in window)) return;
    const reg = await navigator.serviceWorker.ready;
    // `sync` isn't in the bundled TS lib types yet.
    await (reg as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register(SYNC_TAG);
  } catch {
    /* background sync unavailable (e.g. iOS) — the app-side `online` flush covers it */
  }
}
