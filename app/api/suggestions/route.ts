// ---------------------------------------------------------------------------
// POST /api/suggestions  — real, AI-generated "For {name} today" suggestions.
//
// Grounds the model in the care recipient's profile + the current hazard
// situation and generates 3–4 personalised caregiver actions + a "why", in
// EVERY ORCA app language at once. The Info screen caches per situation and the
// reload button forces a fresh generation.
//
// Body: { hazard: "covid" | "dengue", date: string }
// Returns: { en: { suggestions, why }, zh: {...}, ms, id, tl, my }
// ---------------------------------------------------------------------------

import { buildSuggestionsPrompt } from "@/lib/ai";
import { supabaseAdmin } from "@/lib/supabaseServer";
import type { Hazard } from "@/lib/scenario";
import type { Language } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-4.1-mini";
const LANGS: Language[] = ["en", "zh", "ms", "id", "tl", "my"];

interface Suggestion {
  text: string;
  because?: string;
}
interface LangResult {
  suggestions: Suggestion[];
  why: string;
}

async function genOne(lang: Language, hazard: Hazard, date: string): Promise<LangResult | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6, // some variation so "reload" gives a genuinely new take
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSuggestionsPrompt(lang, hazard, date) },
          { role: "user", content: "Generate the suggestions and reasoning now." },
        ],
      }),
    });
    if (!res.ok) {
      console.error("[suggestions] OpenAI error", lang, res.status);
      return null;
    }
    const data = (await res.json()) as { choices?: Array<{ message: { content: string } }> };
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as {
      suggestions?: { text?: string; because?: string }[];
      why?: string;
    };
    const suggestions = (Array.isArray(parsed.suggestions) ? parsed.suggestions : [])
      .filter((s) => s && s.text)
      .map((s) => ({ text: String(s.text), because: s.because ? String(s.because) : undefined }));
    if (!suggestions.length || !parsed.why) return null;
    return { suggestions, why: String(parsed.why) };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (!OPENAI_KEY) return Response.json({});
  const b = (await req.json().catch(() => ({}))) as { hazard?: Hazard; date?: string; force?: boolean };
  const hazard: Hazard = b.hazard === "dengue" ? "dengue" : "covid";
  const date = b.date || "";
  const key = `${hazard}:${hazard === "covid" ? date : "live"}`;
  const force = b.force === true;

  let sb: ReturnType<typeof supabaseAdmin> | null = null;
  try { sb = supabaseAdmin(); } catch { sb = null; }

  // Serve the saved version unless the caller forced a fresh generation.
  // Degrades gracefully if the suggestion_cache table doesn't exist yet.
  if (!force && sb) {
    try {
      const { data } = await sb.from("suggestion_cache").select("data").eq("situation_key", key).maybeSingle();
      const cached = (data as { data?: Record<string, LangResult> } | null)?.data;
      if (cached && Object.keys(cached).length) return Response.json(cached);
    } catch {
      /* table missing / read error → fall through and generate */
    }
  }

  const entries = await Promise.all(LANGS.map(async (l) => [l, await genOne(l, hazard, date)] as const));
  const out: Record<string, LangResult> = {};
  for (const [l, r] of entries) if (r) out[l] = r;

  if (sb && Object.keys(out).length) {
    try {
      await sb.from("suggestion_cache").upsert({ situation_key: key, hazard, data: out, updated_at: new Date().toISOString() });
    } catch {
      /* cache write best-effort */
    }
  }
  return Response.json(out);
}
