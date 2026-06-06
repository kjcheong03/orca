// ---------------------------------------------------------------------------
// Request log — backed by Supabase via the server-side /api/requests route.
// Writes are server-only (the payload carries caregiver/care-recipient PII).
// ---------------------------------------------------------------------------

import type { RequestSession } from "./contract";

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

/** Persist a newly submitted request (server-side insert into Supabase). */
export async function persistRequest(session: RequestSession): Promise<void> {
  await fetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
  });
}
