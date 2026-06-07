// ---------------------------------------------------------------------------
// Classify a caregiver's free-text conditions onto the controlled Target
// vocabulary (Diabetes, Heart, Stroke, Cancer, Kidney, Respiratory, Dementia,
// Immunocompromised, Mobility). Runs the L1-L4 cascade in lib/conditionMatching
// and writes verdicts back into the shared Supabase cache.
//
// Posture is deliberately permissive: a caregiver missing a Stroke alert is
// catastrophic, an extra alert is invisible. Any failure collapses to an empty
// match list so the client falls back to showing all broadcasts.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { classifyConditions } from "@/lib/conditionMatching";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const conditions = Array.isArray(body?.conditions)
    ? (body.conditions as unknown[]).filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    : [];

  if (conditions.length === 0) {
    return NextResponse.json({
      matchedTargets: [] as string[],
      matchedTargetReasons: {} as Record<string, string[]>,
    });
  }

  try {
    const result = await classifyConditions(conditions);
    const matchedTargets = Array.from(new Set(result.map((r) => r.target)));
    const matchedTargetReasons: Record<string, string[]> = {};
    for (const r of result) {
      // dedup conditions per target
      const seen = new Set(matchedTargetReasons[r.target] ?? []);
      for (const c of r.conditions) seen.add(c);
      matchedTargetReasons[r.target] = Array.from(seen);
    }
    return NextResponse.json({ matchedTargets, matchedTargetReasons });
  } catch (err) {
    // Permissive fallback — never block profile save on a classifier error.
    console.error("classify failed", err);
    return NextResponse.json({
      matchedTargets: [] as string[],
      matchedTargetReasons: {} as Record<string, string[]>,
    });
  }
}
