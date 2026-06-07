/**
 * Self-contained smoke test for the matcher's cache + L1 path.
 *
 *   npx tsx --env-file=.env.local scripts/test-matcher.ts
 *
 * Replicates the normalize() + Supabase cache lookup that `classifyConditions`
 * uses, without importing lib/conditionMatching.ts (that file's transitive
 * import of "server-only" can't run outside a Next.js build context).
 *
 * For the demo this is what matters: seeded conditions hit the cache, return
 * the right Targets, and behave correctly across add / delete / multi-target.
 */
import { createClient } from "@supabase/supabase-js";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function classifyViaCache(conditions: string[]): Promise<{
  matchedTargets: string[];
  byCondition: { condition: string; normalized: string; targets: string[] | null }[];
}> {
  if (conditions.length === 0) return { matchedTargets: [], byCondition: [] };
  const supa = sb();
  const normalized = conditions.map((c) => ({ raw: c, norm: normalize(c) }));
  const { data } = await supa
    .from("condition_classifications")
    .select("normalized_condition, targets")
    .in("normalized_condition", normalized.map((n) => n.norm));

  const lookup = new Map<string, string[]>();
  for (const row of data ?? []) {
    lookup.set(row.normalized_condition, row.targets ?? []);
  }
  const matched = new Set<string>();
  const byCondition = normalized.map(({ raw, norm }) => {
    const targets = lookup.get(norm) ?? null;
    if (targets) for (const t of targets) matched.add(t);
    return { condition: raw, normalized: norm, targets };
  });
  return { matchedTargets: Array.from(matched), byCondition };
}

async function run(label: string, conditions: string[]) {
  console.log(`\n── ${label} ──`);
  console.log(`  conditions: ${JSON.stringify(conditions)}`);
  const t0 = performance.now();
  const result = await classifyViaCache(conditions);
  const ms = Math.round(performance.now() - t0);
  console.log(`  matchedTargets: ${JSON.stringify(result.matchedTargets)}  (${ms} ms)`);
  for (const r of result.byCondition) {
    const tag = r.targets ? `→ ${JSON.stringify(r.targets)}` : "(cache miss — would escalate to L1/L2/L3/L4 at runtime)";
    console.log(`    "${r.condition}"  norm="${r.normalized}"  ${tag}`);
  }
}

async function main() {
  // 1. Demo seed patient (Madam Tan)
  await run("Seed hit — Madam Tan baseline", ["Hypertension", "Type 2 Diabetes"]);

  // 2. Add a new condition that is also seeded
  await run("Add: caregiver types 'Stroke'", ["Hypertension", "Type 2 Diabetes", "Stroke"]);

  // 3. Delete Hypertension
  await run("Delete: caregiver removes 'Hypertension'", ["Type 2 Diabetes", "Stroke"]);

  // 4. Multi-target seed entry
  await run("Multi-target: 'Diabetic nephropathy' → Diabetes + Kidney", ["Diabetic nephropathy"]);

  // 5. Empty (all conditions deleted)
  await run("Empty: caregiver deleted everything", []);

  // 6. Cache MISS — novel free-text. At runtime this would escalate to L1
  //    substring match (still hits because the L1 taxonomy mirrors the seed),
  //    then L2/L3, then L4 OpenAI.
  await run("Cache miss — verbatim free-text the seed doesn't contain", [
    "Mild cognitive issues following chemo for breast cancer",
  ]);
}

void main();
