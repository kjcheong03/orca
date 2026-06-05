import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import type { Language } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "gpt-4o-transcribe";

// A short seed phrase in the caregiver's set language. The transcription API
// takes only ONE `language` value (or none) — there's no "id or en, not tl"
// list — so instead of hard-pinning (which would break English speech) we pass
// this as a soft `prompt` bias. It nudges detection toward the set language and
// health vocabulary, making a wrong-language mis-detect (e.g. Tagalog) unlikely,
// while clear English is still transcribed.
const PRIME: Record<Language, string> = {
  en: "A caregiver is asking about an elderly person's health in Singapore.",
  id: "Seorang pengasuh bertanya tentang kesehatan lansia di Singapura.",
  ms: "Seorang penjaga bertanya tentang kesihatan warga emas di Singapura.",
  tl: "Isang tagapag-alaga ang nagtatanong tungkol sa kalusugan ng matanda sa Singapore.",
  zh: "一位看护者在询问新加坡一位长者的健康状况。",
  my: "ပြုစုစောင့်ရှောက်သူတစ်ဦးသည် စင်္ကာပူရှိ သက်ကြီးရွယ်အိုတစ်ဦး၏ ကျန်းမာရေးအကြောင်း မေးနေသည်။",
};

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY missing on server" }, { status: 500 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "expected multipart form-data" }, { status: 400 });
  }

  const audio = form.get("audio");
  const lang = (form.get("lang") as Language | null) ?? "en";
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "audio file is required" }, { status: 400 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const buf = Buffer.from(await audio.arrayBuffer());
    const file = await toFile(buf, "speech.webm", { type: audio.type || "audio/webm" });
    // No hard `language` (so English still works); a `prompt` in the set
    // language biases detection toward it. The reply language is enforced
    // separately by /api/chat, not by what they speak.
    const transcription = await client.audio.transcriptions.create({
      model: MODEL,
      file,
      prompt: PRIME[lang] ?? PRIME.en,
    });
    return NextResponse.json({ text: (transcription.text ?? "").trim() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "transcription failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
