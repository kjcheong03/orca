import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import type { Language } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "gpt-4o-transcribe";

// The selected language is enforced on transcription: the model is told to
// decode in exactly this language (ISO-639-1). Speaking another language while
// set to one of these will be transcribed AS the set language, never detected
// as a third language. The app's codes are already valid ISO-639-1 values.
const ISO: Record<Language, string> = {
  en: "en",
  id: "id",
  ms: "ms",
  tl: "tl",
  zh: "zh",
  my: "my",
  ta: "ta",
};

// A short seed phrase in the set language — domain/vocabulary priming to
// sharpen accuracy alongside the enforced language.
const PRIME: Record<Language, string> = {
  en: "A caregiver is asking about an elderly person's health in Singapore.",
  id: "Seorang pengasuh bertanya tentang kesehatan lansia di Singapura.",
  ms: "Seorang penjaga bertanya tentang kesihatan warga emas di Singapura.",
  tl: "Isang tagapag-alaga ang nagtatanong tungkol sa kalusugan ng matanda sa Singapore.",
  zh: "一位看护者在询问新加坡一位长者的健康状况。",
  my: "ပြုစုစောင့်ရှောက်သူတစ်ဦးသည် စင်္ကာပူရှိ သက်ကြီးရွယ်အိုတစ်ဦး၏ ကျန်းမာရေးအကြောင်း မေးနေသည်။",
  ta: "ஒரு பராமரிப்பாளர் சிங்கப்பூரில் வயதான ஒருவரின் உடல்நலம் குறித்து கேட்கிறார்.",
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
    // Enforce the selected language so transcription is locked to it.
    const transcription = await client.audio.transcriptions.create({
      model: MODEL,
      file,
      language: ISO[lang] ?? "en",
      prompt: PRIME[lang] ?? PRIME.en,
    });
    return NextResponse.json({ text: (transcription.text ?? "").trim() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "transcription failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
