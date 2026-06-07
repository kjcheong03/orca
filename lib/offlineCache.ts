// Last-known-good cache for read-only API responses, so read views stay useful
// offline. Small JSON payloads (broadcasts, AI suggestions, the request log)
// are kept in localStorage with the time they were saved, so the UI can show a
// "saved earlier" note. Best-effort: every access is guarded and swallows
// errors (private mode / quota / SSR) — caching must never break a render.

const PREFIX = "orca-cache:";

export interface Cached<T> {
  data: T;
  /** ISO timestamp of when this snapshot was saved. */
  savedAt: string;
}

export function saveCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const entry: Cached<T> = { data, savedAt: new Date().toISOString() };
    window.localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    /* quota exceeded / storage unavailable — caching is best-effort */
  }
}

export function readCache<T>(key: string): Cached<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as Cached<T>;
  } catch {
    return null;
  }
}
