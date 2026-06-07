// One-off cleanup: remove test-fixture rows that the offline validation pushed
// into the shared Supabase demo backend (sessions named "Test Recipient" /
// ids starting "req-offline-test"). Run: node scripts/cleanup-test-requests.mjs
import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

async function env() {
  const out = {};
  try {
    const txt = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return { ...out, ...process.env };
}

async function main() {
  const e = await env();
  const url = e.NEXT_PUBLIC_SUPABASE_URL;
  const key = e.SUPABASE_SECRET_KEY || e.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log("No Supabase config in .env.local — nothing to clean.");
    return;
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  // Find offending sessions.
  const { data: sessions, error } = await sb
    .from("request_sessions")
    .select("id, care_recipient_name")
    .or("care_recipient_name.in.(Test Recipient,Offline Test),id.like.req-offline%");
  if (error) {
    console.error("query failed:", error.message);
    process.exit(1);
  }
  const ids = (sessions ?? []).map((s) => s.id);
  console.log("found test sessions:", ids);
  if (ids.length === 0) {
    console.log("nothing to delete.");
    return;
  }

  // Delete children first (in case FKs don't cascade), then the sessions.
  // Routes are keyed by task; gather task ids → route ids → route items.
  const { data: tasks } = await sb.from("request_tasks").select("id").in("session_id", ids);
  const taskIds = (tasks ?? []).map((t) => t.id);
  if (taskIds.length) {
    const { data: routes } = await sb.from("request_routes").select("id").in("task_id", taskIds);
    const routeIds = (routes ?? []).map((r) => r.id);
    if (routeIds.length) {
      await sb.from("request_route_items").delete().in("route_id", routeIds);
      await sb.from("request_routes").delete().in("id", routeIds);
    }
    await sb.from("request_tasks").delete().in("id", taskIds);
  }
  const { error: dErr } = await sb.from("request_sessions").delete().in("id", ids);
  if (dErr) {
    console.error("delete failed:", dErr.message);
    process.exit(1);
  }
  console.log(`deleted ${ids.length} test session(s) and their children.`);
}

main().catch((e) => {
  console.error("cleanup crashed:", e);
  process.exit(1);
});
