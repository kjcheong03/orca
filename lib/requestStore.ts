// ---------------------------------------------------------------------------
// Local request log for the community help flow (frontend prototype).
//
// Submitted requests are persisted to localStorage so the caregiver can see a
// log of what they've sent and its status. No backend — this is a mock store.
// ---------------------------------------------------------------------------

import type { RequestSession } from "./community";

const KEY = "cara.requests";

/** All submitted requests, newest first. Safe on the server (returns []). */
export function loadRequests(): RequestSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RequestSession[]) : [];
  } catch {
    return [];
  }
}

/** Prepend a newly submitted request to the log. */
export function persistRequest(session: RequestSession): void {
  if (typeof window === "undefined") return;
  try {
    const all = loadRequests();
    all.unshift(session);
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore quota / serialization errors in the prototype
  }
}
