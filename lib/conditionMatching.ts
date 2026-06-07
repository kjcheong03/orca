// ---------------------------------------------------------------------------
// Condition → Target classifier (L1 synonym · L2 token · L3 fuzzy · L4 AI).
//
// Used by /api/profile/classify to map free-text patient conditions onto the 9
// controlled Target categories that the Authority Dashboard broadcast picker
// understands. Also exposes a synchronous helper used by the client-side
// broadcast filter, which already has profile.matchedTargets precomputed.
//
// Posture: PERMISSIVE everywhere. A caregiver missing a Stroke alert is
// catastrophic; an extra alert is invisible. Every L4 error path returns a
// match=true verdict tagged 'L4_fallback' so callers degrade gracefully.
// ---------------------------------------------------------------------------

import { supabaseAdmin } from "./supabaseServer";

export type Target =
  | "Diabetes"
  | "Heart"
  | "Stroke"
  | "Cancer"
  | "Kidney"
  | "Respiratory"
  | "Dementia"
  | "Immunocompromised"
  | "Mobility";

export const ALL_TARGETS: readonly Target[] = [
  "Diabetes",
  "Heart",
  "Stroke",
  "Cancer",
  "Kidney",
  "Respiratory",
  "Dementia",
  "Immunocompromised",
  "Mobility",
];

export interface MatchVerdict {
  condition: string;
  target: Target;
  match: boolean;
  source: "L1_synonym" | "L2_token" | "L3_fuzzy" | "L4_ai" | "L4_fallback";
  confidence: number;
  reason?: string;
}

// ---------------------------------------------------------------------------
// L1 taxonomy — runtime synonym map. Mirrors scripts/seed-classifications.ts
// so an empty cache still classifies correctly.
// ---------------------------------------------------------------------------

const TAXONOMY: Record<Target, string[]> = {
  Diabetes: [
    "diabetes",
    "diabetic",
    "type 1",
    "type i",
    "type 2",
    "type ii",
    "t1dm",
    "t2dm",
    "prediabetes",
    "pre diabetes",
    "borderline diabetes",
    "gestational",
    "insulin dependent",
    "adult onset diabetes",
    "diabetic neuropathy",
    "diabetic retinopathy",
    "diabetic nephropathy",
    "diabetic foot",
  ],
  Heart: [
    "heart",
    "cardiac",
    "hypertension",
    "high blood pressure",
    "high bp",
    "htn",
    "coronary",
    "cad",
    "ihd",
    "ischemic heart",
    "ischaemic heart",
    "angina",
    "mi",
    "myocardial",
    "heart attack",
    "post mi",
    "heart failure",
    "chf",
    "congestive",
    "systolic heart failure",
    "diastolic heart failure",
    "atrial fibrillation",
    "afib",
    "a fib",
    "arrhythmia",
    "valvular",
    "mitral valve",
    "aortic stenosis",
    "aortic regurgitation",
    "pacemaker",
    "icd",
    "cardiomyopathy",
    "cardiac arrest",
    "cholesterol",
    "hypercholesterolemia",
    "hyperlipidemia",
    "dyslipidemia",
    "peripheral artery disease",
    "pad",
  ],
  Stroke: [
    "stroke",
    "cva",
    "cerebrovascular",
    "tia",
    "transient ischemic",
    "transient ischaemic",
    "mini stroke",
    "post stroke",
    "previous stroke",
    "history of stroke",
    "hemiparesis",
    "hemiplegia",
    "aphasia",
    "ischemic stroke",
    "ischaemic stroke",
    "hemorrhagic stroke",
    "haemorrhagic stroke",
  ],
  Cancer: [
    "cancer",
    "carcinoma",
    "tumor",
    "tumour",
    "malignant",
    "malignancy",
    "metastatic",
    "metastasis",
    "metastases",
    "oncology",
    "in remission",
    "stage iv",
    "lung cancer",
    "breast cancer",
    "colorectal",
    "colon cancer",
    "rectal cancer",
    "prostate cancer",
    "pancreatic cancer",
    "liver cancer",
    "stomach cancer",
    "gastric cancer",
    "ovarian cancer",
    "cervical cancer",
    "thyroid cancer",
    "bladder cancer",
    "kidney cancer",
    "leukemia",
    "leukaemia",
    "aml",
    "cml",
    "cll",
    "lymphoma",
    "hodgkin",
    "non hodgkin",
    "nhl",
    "melanoma",
    "chemotherapy",
    "chemo",
    "radiotherapy",
    "radiation therapy",
    "multiple myeloma",
  ],
  Kidney: [
    "kidney",
    "renal",
    "ckd",
    "esrd",
    "end stage renal",
    "end stage kidney",
    "kidney failure",
    "renal failure",
    "acute kidney injury",
    "aki",
    "dialysis",
    "hemodialysis",
    "haemodialysis",
    "peritoneal dialysis",
    "glomerulonephritis",
    "kidney transplant",
    "polycystic kidney",
    "pkd",
    "nephropathy",
  ],
  Respiratory: [
    "copd",
    "chronic obstructive pulmonary",
    "asthma",
    "bronchial asthma",
    "chronic bronchitis",
    "emphysema",
    "pulmonary fibrosis",
    "ipf",
    "idiopathic pulmonary fibrosis",
    "interstitial lung",
    "ild",
    "obstructive sleep apnea",
    "obstructive sleep apnoea",
    "sleep apnea",
    "sleep apnoea",
    "osa",
    "bronchiectasis",
    "pulmonary hypertension",
    "tuberculosis",
    "tb",
    "home oxygen",
    "on home oxygen",
    "respiratory failure",
  ],
  Dementia: [
    "dementia",
    "alzheimer",
    "alzheimers",
    "vascular dementia",
    "lewy body",
    "lbd",
    "frontotemporal dementia",
    "ftd",
    "mild cognitive impairment",
    "mci",
    "memory loss",
    "memory problems",
    "cognitive decline",
    "cognitive impairment",
  ],
  Immunocompromised: [
    "immunocompromised",
    "immunosuppressed",
    "immunosuppressant",
    "immunosuppressants",
    "immune deficiency",
    "immunodeficiency",
    "hiv",
    "aids",
    "post transplant",
    "organ transplant",
    "liver transplant",
    "heart transplant",
    "lung transplant",
    "bone marrow transplant",
    "tacrolimus",
    "cyclosporine",
    "mycophenolate",
    "long term steroids",
    "long term prednisone",
    "chronic steroid",
    "neutropenia",
    "neutropenic",
    "systemic lupus",
    "sle",
    "lupus",
    "biologics",
    "splenectomy",
    "no spleen",
    "asplenia",
    "chemotherapy",
    "chemo",
  ],
  Mobility: [
    "mobility",
    "limited mobility",
    "reduced mobility",
    "wheelchair",
    "walker",
    "cane",
    "walking aid",
    "frail",
    "frailty",
    "parkinson",
    "parkinsons",
    "pd",
    "history of falls",
    "recurrent falls",
    "fall risk",
    "recent fall",
    "bedbound",
    "bed bound",
    "bedridden",
    "osteoarthritis",
    "osteoporosis",
    "hip fracture",
    "hip replacement",
    "amputation",
    "multiple sclerosis",
    "ms",
    "spinal cord injury",
    "arthritis",
    "hemiparesis",
    "hemiplegia",
    "gait",
  ],
};

// ---------------------------------------------------------------------------
// Normalization + sanitisation
// ---------------------------------------------------------------------------

export function normalizeCondition(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

/** Sanitise for the L4 prompt: allow-list charset, length cap. */
function sanitiseForPrompt(s: string): string {
  const allow = s.replace(/[^A-Za-z0-9 \-\/(),'.]/g, " ").replace(/\s+/g, " ").trim();
  return allow.slice(0, 80);
}

function tokens(s: string): string[] {
  return s.split(" ").filter((t) => t.length >= 3);
}

// ---------------------------------------------------------------------------
// L1: substring / synonym match
// ---------------------------------------------------------------------------

function l1Synonym(normCondition: string, target: Target): MatchVerdict | null {
  const syns = TAXONOMY[target];
  for (const syn of syns) {
    const normSyn = normalizeCondition(syn);
    if (!normSyn) continue;
    if (normCondition.includes(normSyn) || normSyn.includes(normCondition)) {
      return {
        condition: normCondition,
        target,
        match: true,
        source: "L1_synonym",
        confidence: 1.0,
        reason: `matches synonym "${syn}"`,
      };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// L2: token overlap
// ---------------------------------------------------------------------------

function l2TokenOverlap(normCondition: string, target: Target): MatchVerdict | null {
  const condTokens = new Set(tokens(normCondition));
  if (condTokens.size === 0) return null;
  for (const syn of TAXONOMY[target]) {
    const synTokens = tokens(normalizeCondition(syn));
    for (const t of synTokens) {
      if (condTokens.has(t)) {
        return {
          condition: normCondition,
          target,
          match: true,
          source: "L2_token",
          confidence: 0.8,
          reason: `shared token "${t}"`,
        };
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// L3: Levenshtein fuzzy match (inline DP, no external dep)
// ---------------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }
  return prev[b.length];
}

function l3Fuzzy(normCondition: string, target: Target): MatchVerdict | null {
  for (const syn of TAXONOMY[target]) {
    const normSyn = normalizeCondition(syn);
    if (!normSyn) continue;
    const minLen = Math.min(normCondition.length, normSyn.length);
    if (minLen < 4) continue;
    const threshold = Math.max(1, Math.floor(minLen / 6));
    const dist = levenshtein(normCondition, normSyn);
    if (dist <= threshold) {
      const confidence = Math.max(0.5, 0.65 - dist * 0.1);
      return {
        condition: normCondition,
        target,
        match: true,
        source: "L3_fuzzy",
        confidence,
        reason: `fuzzy "${syn}" dist=${dist}`,
      };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public: L1 → L2 → L3 (no AI)
// ---------------------------------------------------------------------------

export function l1l2l3(condition: string, target: Target): MatchVerdict | null {
  const norm = normalizeCondition(condition);
  if (!norm) return null;
  return l1Synonym(norm, target) ?? l2TokenOverlap(norm, target) ?? l3Fuzzy(norm, target);
}

// ---------------------------------------------------------------------------
// L4: OpenAI batch classifier (private)
// ---------------------------------------------------------------------------

interface L4Pair {
  id: string;
  condition: string;
  target: Target;
}

interface L4Result {
  id: string;
  match: boolean;
  confidence: number;
  reason?: string;
}

async function l4_aiClassify(pairs: L4Pair[]): Promise<MatchVerdict[]> {
  const fallback = (): MatchVerdict[] =>
    pairs.map((p) => ({
      condition: p.condition,
      target: p.target,
      match: true,
      source: "L4_fallback",
      confidence: 0.5,
      reason: "L4 unavailable — permissive fallback",
    }));

  const key = process.env.OPENAI_API_KEY;
  if (!key || pairs.length === 0) return fallback();

  const systemPrompt =
    "You are a clinical condition classifier for an elderly-care broadcast system. " +
    "For each (condition, target) pair, decide if the free-text condition falls under " +
    "the target category. Be inclusive of common comorbidities, subtypes, and lay terms; " +
    "do NOT match unrelated conditions. Return ONLY valid JSON matching the schema.\n\n" +
    "Target scope:\n" +
    "- Diabetes: T1/T2, pre-diabetes, diabetic complications\n" +
    "- Heart: cardiac disease, CHF, arrhythmia, hypertension, post-MI, CAD\n" +
    "- Stroke: CVA, TIA, post-stroke deficits\n" +
    "- Cancer: any malignancy, oncology treatment, remission\n" +
    "- Kidney: CKD, ESRD, dialysis, renal failure\n" +
    "- Respiratory: COPD, asthma, emphysema, pulmonary fibrosis, OSA\n" +
    "- Dementia: Alzheimer's, vascular dementia, MCI, Lewy body\n" +
    "- Immunocompromised: immunosuppressants, post-transplant, HIV, chemo\n" +
    "- Mobility: falls, gait issues, Parkinson's, frailty, post-stroke mobility";

  const userPayload = JSON.stringify({
    pairs: pairs.map((p) => ({
      id: p.id,
      condition: sanitiseForPrompt(p.condition),
      target: p.target,
    })),
  });

  const schema = {
    name: "condition_classifications",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        results: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "match", "confidence"],
            properties: {
              id: { type: "string" },
              match: { type: "boolean" },
              confidence: { type: "number" },
              reason: { type: "string" },
            },
          },
        },
      },
      required: ["results"],
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPayload },
        ],
        response_format: { type: "json_schema", json_schema: schema },
      }),
      signal: controller.signal,
    });
    if (!res.ok) return fallback();
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (typeof raw !== "string") return fallback();
    let parsed: { results?: L4Result[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return fallback();
    }
    const results = Array.isArray(parsed.results) ? parsed.results : null;
    if (!results) return fallback();

    const byId = new Map<string, L4Result>();
    for (const r of results) {
      if (r && typeof r.id === "string") byId.set(r.id, r);
    }
    return pairs.map((p) => {
      const r = byId.get(p.id);
      if (!r) {
        return {
          condition: p.condition,
          target: p.target,
          match: true,
          source: "L4_fallback",
          confidence: 0.5,
          reason: "missing id in L4 response",
        };
      }
      const ok = r.match === true && typeof r.confidence === "number" && r.confidence >= 0.7;
      return {
        condition: p.condition,
        target: p.target,
        match: ok,
        source: "L4_ai",
        confidence: typeof r.confidence === "number" ? r.confidence : 0,
        reason: r.reason,
      };
    });
  } catch {
    return fallback();
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Cache layer: condition_classifications table on Supabase
// ---------------------------------------------------------------------------

interface CacheRow {
  normalized_condition: string;
  targets: Target[];
  hit_count?: number | null;
}

async function readCache(normalised: string[]): Promise<Map<string, Target[]>> {
  const out = new Map<string, Target[]>();
  if (normalised.length === 0) return out;
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("condition_classifications")
      .select("normalized_condition, targets, hit_count")
      .in("normalized_condition", normalised);
    if (error || !data) return out;
    for (const row of data as CacheRow[]) {
      if (row?.normalized_condition && Array.isArray(row.targets)) {
        out.set(row.normalized_condition, row.targets);
      }
    }
    // Best-effort hit_count bump; we don't await/block on errors.
    void (async () => {
      try {
        for (const row of data as CacheRow[]) {
          await sb
            .from("condition_classifications")
            .update({ hit_count: (row.hit_count ?? 0) + 1 })
            .eq("normalized_condition", row.normalized_condition);
        }
      } catch {
        // swallow — cache stats are non-critical
      }
    })();
  } catch {
    // permissive: missing env / network → empty cache
  }
  return out;
}

async function writeCache(rows: { normalized_condition: string; targets: Target[] }[]): Promise<void> {
  if (rows.length === 0) return;
  try {
    const sb = supabaseAdmin();
    await sb.from("condition_classifications").upsert(
      rows.map((r) => ({
        normalized_condition: r.normalized_condition,
        targets: r.targets,
        model: "runtime-classifier",
        reasoning: "L1-L4 cascade",
      })),
      { onConflict: "normalized_condition" },
    );
  } catch {
    // permissive: cache write failures don't block classification
  }
}

// ---------------------------------------------------------------------------
// Public: classifyConditions (server-side, cache + L1-L3 + batched L4)
// ---------------------------------------------------------------------------

export async function classifyConditions(
  conditions: string[],
): Promise<{ target: Target; conditions: string[]; source: MatchVerdict["source"] }[]> {
  // Dedup + normalise.
  const normMap = new Map<string, string>(); // normalised → original (first occurrence)
  for (const raw of conditions) {
    const norm = normalizeCondition(raw);
    if (!norm) continue;
    if (!normMap.has(norm)) normMap.set(norm, raw);
  }
  const normalisedList = Array.from(normMap.keys());
  if (normalisedList.length === 0) return [];

  // a) Cache lookup.
  const cache = await readCache(normalisedList);

  // Aggregator: target → { conditions: Set, bestSource }
  const sourceRank: Record<MatchVerdict["source"], number> = {
    L1_synonym: 5,
    L4_ai: 4,
    L2_token: 3,
    L3_fuzzy: 2,
    L4_fallback: 1,
  };
  const agg = new Map<Target, { conditions: Set<string>; source: MatchVerdict["source"] }>();
  function record(target: Target, condition: string, source: MatchVerdict["source"]) {
    const entry = agg.get(target);
    if (!entry) {
      agg.set(target, { conditions: new Set([condition]), source });
    } else {
      entry.conditions.add(condition);
      if (sourceRank[source] > sourceRank[entry.source]) entry.source = source;
    }
  }

  // b/c) Apply cached verdicts; collect uncached conditions for L1-L3.
  const uncached: string[] = [];
  for (const norm of normalisedList) {
    const cached = cache.get(norm);
    if (cached && cached.length > 0) {
      for (const t of cached) record(t, normMap.get(norm) ?? norm, "L1_synonym");
    } else if (cached && cached.length === 0) {
      // Explicit cached non-match — still skip L1-L3.
    } else {
      uncached.push(norm);
    }
  }

  // d) L1-L3 for uncached. Track unresolved (condition, target) pairs for L4.
  const l13Resolved = new Map<string, Set<Target>>(); // normalised cond → matched targets
  const unresolvedPairs: L4Pair[] = [];
  let pairId = 0;
  for (const norm of uncached) {
    const matched = new Set<Target>();
    const missing: Target[] = [];
    for (const target of ALL_TARGETS) {
      const v = l1l2l3(norm, target);
      if (v && v.match) {
        matched.add(target);
        record(target, normMap.get(norm) ?? norm, v.source);
      } else {
        missing.push(target);
      }
    }
    l13Resolved.set(norm, matched);
    // Only escalate targets that L1-L3 didn't already accept. If L1-L3 gave us
    // at least one target for this condition, skip L4 entirely for it — the
    // condition is classified and L4 is rate-limited.
    if (matched.size === 0) {
      for (const target of missing) {
        unresolvedPairs.push({
          id: String(pairId++),
          condition: norm,
          target,
        });
      }
    }
  }

  // e) L4 batch on remaining unresolved pairs.
  let l4Verdicts: MatchVerdict[] = [];
  if (unresolvedPairs.length > 0 && process.env.OPENAI_API_KEY) {
    l4Verdicts = await l4_aiClassify(unresolvedPairs);
  } else if (unresolvedPairs.length > 0) {
    // No API key → permissive fallback so nothing silently disappears.
    l4Verdicts = unresolvedPairs.map((p) => ({
      condition: p.condition,
      target: p.target,
      match: true,
      source: "L4_fallback",
      confidence: 0.5,
      reason: "OPENAI_API_KEY not set",
    }));
  }

  // Merge L4 results back into aggregator + per-condition target set.
  for (const v of l4Verdicts) {
    if (!v.match) continue;
    const set = l13Resolved.get(v.condition) ?? new Set<Target>();
    set.add(v.target);
    l13Resolved.set(v.condition, set);
    record(v.target, normMap.get(v.condition) ?? v.condition, v.source);
  }

  // f) Write back newly-classified rows so we never re-classify them.
  const newRows: { normalized_condition: string; targets: Target[] }[] = [];
  for (const norm of uncached) {
    const matched = l13Resolved.get(norm);
    if (!matched) continue;
    newRows.push({
      normalized_condition: norm,
      targets: Array.from(matched),
    });
  }
  // Fire-and-forget write; classification result is independent.
  void writeCache(newRows);

  // Materialise output.
  return Array.from(agg.entries()).map(([target, { conditions: condSet, source }]) => ({
    target,
    conditions: Array.from(condSet),
    source,
  }));
}

// ---------------------------------------------------------------------------
// Public: matchesAnyTarget — synchronous broadcast filter (no AI, no I/O)
// ---------------------------------------------------------------------------

export async function matchesAnyTarget(
  conditions: string[],
  targets: Target[],
): Promise<boolean> {
  // Empty audience targets = broadcast to all caregivers.
  if (!targets || targets.length === 0) return true;
  if (!conditions || conditions.length === 0) return false;
  const conditionSet = new Set(conditions as Target[]);
  for (const t of targets) {
    if (conditionSet.has(t)) return true;
  }
  return false;
}
