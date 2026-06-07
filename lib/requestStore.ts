// ---------------------------------------------------------------------------
// Request log — backed by Supabase via the server-side /api/requests route.
// Writes are server-only (the payload carries caregiver/care-recipient PII).
// ---------------------------------------------------------------------------

import type { RequestSession } from "./contract";
import { enqueueRequest, requestBackgroundSync } from "./requestQueue";
import { isOffline } from "./online";

/** Whether a submit reached the server, or was queued locally for later. */
export type SubmitResult = "sent" | "queued";

/**
 * All submitted requests, newest first. Throws on failure (rather than returning []),
 * so the caller can tell a genuine empty list apart from a failed load and avoid showing
 * a misleading "no requests" state.
 */
export async function loadRequests(): Promise<RequestSession[]> {
  const res = await fetch("/api/requests", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load requests (${res.status})`);
  return (await res.json()) as RequestSession[];
}

/**
 * Persist a newly submitted request. Online, this is a server-side insert into
 * Supabase. Offline (or if the network fails mid-submit), the request is saved
 * to the local outbox and replayed when the connection returns — so a request
 * is never lost. Returns whether it was "sent" or "queued".
 */
export async function persistRequest(session: RequestSession): Promise<SubmitResult> {
  if (isOffline()) {
    await enqueueRequest(session);
    void requestBackgroundSync();
    return "queued";
  }
  try {
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    });
    if (!res.ok) throw new Error(`Failed to submit request (${res.status})`);
    return "sent";
  } catch {
    // The network dropped between the online check and the POST — queue it so
    // it isn't lost, and let the outbox flush it later.
    await enqueueRequest(session);
    void requestBackgroundSync();
    return "queued";
  }
}
