import { createClient } from "@supabase/supabase-js";

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { count } = await sb
    .from("condition_classifications")
    .select("*", { count: "exact", head: true });

  console.log(`Rows in condition_classifications: ${count}`);

  const samples = [
    "type 2 diabetes",
    "hypertension",
    "copd",
    "alzheimers",
    "parkinsons",
    "ckd",
    "stroke",
  ];
  for (const s of samples) {
    const { data } = await sb
      .from("condition_classifications")
      .select("normalized_condition, targets")
      .eq("normalized_condition", s)
      .maybeSingle();
    console.log(`  "${s}" → ${data ? JSON.stringify(data.targets) : "(not found)"}`);
  }
}

void main();
