// ---------------------------------------------------------------------------
// Live broadcasts — fetched from the server-side /api/broadcasts route, which
// reads the authority dashboard's `broadcasts` table in the shared Supabase
// project. Read-only; the browser never touches Supabase directly.
// ---------------------------------------------------------------------------

import type { Broadcast } from "./types";

/** Latest authority broadcasts, newest first. Throws on failure so the caller
 *  can fall back to the bundled seed copy instead of showing an empty banner. */
export async function loadBroadcasts(): Promise<Broadcast[]> {
  const res = await fetch("/api/broadcasts", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load broadcasts (${res.status})`);
  return (await res.json()) as Broadcast[];
}
