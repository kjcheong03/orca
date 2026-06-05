import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "gpt-4o-mini-tts";
const VOICE = "marin"; // matches the dubbed video tracks
const MAX_CHARS = 1500; // replies are short; guard against abuse

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY missing on server" }, { status: 500 });
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const text = (body.text ?? "").trim().slice(0, MAX_CHARS);
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const speech = await client.audio.speech.create({
      model: MODEL,
      voice: VOICE,
      input: text,
      response_format: "mp3",
      instructions: "Warm, calm, caring tone. Speak clearly and at a gentle pace.",
    });
    const buf = Buffer.from(await speech.arrayBuffer());
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "tts failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
