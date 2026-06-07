// ---------------------------------------------------------------------------
// Live broadcasts — fetched from the server-side /api/broadcasts route, which
// reads the authority dashboard's `broadcasts` table in the shared Supabase
// project. Read-only; the browser never touches Supabase directly.
// ---------------------------------------------------------------------------

import type { Broadcast } from "./types";

// NOTE: do NOT import from "./conditionMatching" here — that module imports
// lib/supabaseServer (and therefore "server-only"), which breaks client
// bundling. This file is imported by client components (BroadcastBanner,
// BroadcastSheet), so the filter below must stay pure / synchronous.

/** Latest authority broadcasts, newest first. Throws on failure so the caller
 *  can fall back to the bundled seed copy instead of showing an empty banner. */
export async function loadBroadcasts(): Promise<Broadcast[]> {
  const res = await fetch("/api/broadcasts", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load broadcasts (${res.status})`);
  return (await res.json()) as Broadcast[];
}

/** Filter broadcasts to those visible for a profile's classified Targets.
 *  Uses a synchronous overlap check rather than the async matchesAnyTarget
 *  — the matchedTargets list is already classified upstream on profile save
 *  via the L1-L4 matcher cascade, so no AI / cache lookup is needed at
 *  filter time. */
export function filterBroadcastsForProfile(
  broadcasts: Broadcast[],
  matchedTargets: string[],
): Broadcast[] {
  return broadcasts.filter((b) => {
    // No audience constraint = visible to everyone (back-compat for rows
    // written before the audience fields existed).
    if (!b.audienceMode || b.audienceMode === "all") return true;
    if (!b.targetProfiles || b.targetProfiles.length === 0) return true;
    // selected mode + targets — visible iff overlap.
    return b.targetProfiles.some((t) => matchedTargets.includes(t));
  });
}
