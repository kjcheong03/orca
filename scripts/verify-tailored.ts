import { createClient } from "@supabase/supabase-js";

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, count } = await sb
    .from("tailored_guidance")
    .select("hazard, target, source, url", { count: "exact" })
    .order("hazard")
    .order("target");

  console.log(`Total rows in tailored_guidance: ${count}\n`);
  for (const r of data ?? []) {
    console.log(`  [${r.hazard.padEnd(6)}] ${r.target.padEnd(18)} ${r.source.padEnd(28)} ${r.url}`);
  }
  console.log("\n— Madam Tan (matchedTargets ['Heart','Diabetes']) sees on COVID hazard: —");
  const { data: covid } = await sb
    .from("tailored_guidance")
    .select("target, source, url")
    .eq("hazard", "covid")
    .in("target", ["Heart", "Diabetes"]);
  for (const r of covid ?? []) {
    console.log(`  [${r.target}] ${r.source} → ${r.url}`);
  }
  console.log("\n— …and on Dengue hazard: —");
  const { data: dengue } = await sb
    .from("tailored_guidance")
    .select("target, source, url")
    .eq("hazard", "dengue")
    .in("target", ["Heart", "Diabetes"]);
  for (const r of dengue ?? []) {
    console.log(`  [${r.target}] ${r.source} → ${r.url}`);
  }
}

void main();
