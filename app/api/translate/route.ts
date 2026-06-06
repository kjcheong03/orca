import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "gpt-4o-mini";

// Target languages a caregiver can send an alert in (recipient's language).
const LABELS: Record<string, string> = {
  en: "English",
  zh: "Simplified Chinese (简体中文)",
  ms: "Malay (Bahasa Melayu)",
  ta: "Tamil (தமிழ்)",
  id: "Bahasa Indonesia",
  tl: "Tagalog (Filipino)",
  my: "Burmese (မြန်မာ, Unicode — never Zawgyi)",
};

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY missing on server" }, { status: 500 });
  }

  let body: { text?: string; target?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  const label = LABELS[body.target ?? "en"] ?? "English";
  if (!text) return NextResponse.json({ text: "" });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `Translate the user's message to ${label}. It is an urgent caregiving alert — keep it clear, natural, and faithful. Output ONLY the translation in plain text: no preface, no quotes, no notes. Preserve names, numbers, and addresses exactly.`,
        },
        { role: "user", content: text },
      ],
    });
    return NextResponse.json({ text: completion.choices[0]?.message?.content?.trim() || text });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "translate failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
