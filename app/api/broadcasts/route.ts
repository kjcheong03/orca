// ---------------------------------------------------------------------------
// Real authority broadcasts, read server-side from the shared Supabase project.
//
// The ORCA Authority Dashboard writes approved broadcasts into the `broadcasts`
// table (service-role). This route reads the latest sent broadcasts and maps
// them onto ORCA's Broadcast shape so the banner + sheet show real advisories.
// Service-role only — the browser never queries Supabase directly.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import type { Broadcast } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BroadcastRow {
  id: string;
  title: string;
  body: string;
  urgency: "HIGH" | "NORMAL";
  sent_at: string;
  status: string;
  audience_mode: 'all' | 'selected' | null;
  target_profiles: string[] | null;
  draft_snapshot: { translations?: Record<string, { title?: string; body?: string }> } | null;
  runs: { topic: string | null } | { topic: string | null }[] | null;
}

export async function GET() {
  let supabase: ReturnType<typeof supabaseAdmin>;
  try {
    supabase = supabaseAdmin();
  } catch {
    // No Supabase config → empty list; the client keeps its bundled seed copy.
    return NextResponse.json([] as Broadcast[]);
  }

  const { data, error } = await supabase
    .from("broadcasts")
    .select("id, title, body, urgency, sent_at, status, audience_mode, target_profiles, draft_snapshot, runs(topic)")
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(20);

  if (error) {
    // Don't echo raw DB error text to an unauthenticated client; the client
    // keeps its bundled seed copy when this returns an empty list.
    console.error("Failed to load broadcasts", error);
    return NextResponse.json([] as Broadcast[]);
  }

  const broadcasts: Broadcast[] = ((data ?? []) as BroadcastRow[]).map((row) => {
    const topic = Array.isArray(row.runs) ? row.runs[0]?.topic : row.runs?.topic;
    // Per-language versions stored by the authority dashboard (English is the base).
    const rawTr = row.draft_snapshot?.translations ?? {};
    const translations: Record<string, { title: string; body: string }> = {};
    for (const [lng, v] of Object.entries(rawTr)) {
      if (v && typeof v === "object") {
        translations[lng] = { title: String(v.title ?? row.title), body: formatBody(String(v.body ?? row.body)) };
      }
    }
    return {
      id: row.id,
      title: row.title,
      body: formatBody(row.body),
      source: sourceForTopic(topic),
      time: formatSgt(row.sent_at),
      urgency: row.urgency,
      translations,
      audienceMode: row.audience_mode ?? 'all',
      targetProfiles: Array.isArray(row.target_profiles) ? row.target_profiles : [],
    };
  });

  return NextResponse.json(broadcasts);
}

/** The issuing agency, inferred from the run topic (advisories are MOH/NEA-led). */
function sourceForTopic(topic?: string | null): string {
  const t = (topic ?? "").toLowerCase();
  if (t.includes("dengue") || t.includes("zika") || t.includes("mosquito") || t.includes("haze")) {
    return "NEA";
  }
  return "MOH";
}

/** Authority drafts are markdown with **section headers**, paragraphs, and
 *  [links](url). Keep that structure (strip only images + collapse blank runs)
 *  so the sheet can render bold headers, spacing, and clickable links. */
function formatBody(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images can't render in the sheet
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Format an ISO timestamp in Singapore time: "8:30 AM" today, "5 Jun, 8:30 AM" otherwise. */
function formatSgt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const tz = "Asia/Singapore";
  // en-US gives uppercase AM/PM to match ORCA's existing broadcast style.
  const time = d.toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true });
  const dayKey = d.toLocaleDateString("en-CA", { timeZone: tz });
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: tz });
  if (dayKey === todayKey) return time;
  const date = d.toLocaleDateString("en-GB", { timeZone: tz, day: "numeric", month: "short" });
  return `${date}, ${time}`;
}
