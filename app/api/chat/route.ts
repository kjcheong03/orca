import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildChatSystemPrompt } from "@/lib/ai";
import { allVideos } from "@/lib/media";
import type { Hazard } from "@/lib/scenario";
import type { Language } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "gpt-4o-mini";

type IncomingMsg = { role: "user" | "assistant"; text: string };

const VIDEO_IDS = allVideos.map((v) => v.id);

const replySchema = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "videoId", "severity"],
  properties: {
    reply: {
      type: "string",
      description: "Short, warm caregiving answer in the requested language (1–3 sentences).",
    },
    videoId: {
      type: ["string", "null"],
      enum: [...VIDEO_IDS, null],
      description: "A listed video id when it directly helps, otherwise null.",
    },
    severity: { type: "string", enum: ["info", "caution", "urgent", "emergency"] },
  },
} as const;

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY missing on server" }, { status: 500 });
  }

  let body: { messages?: IncomingMsg[]; lang?: Language; hazard?: Hazard; date?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const messages = (body.messages ?? []).slice(-12);
  const lang: Language = body.lang ?? "en";
  const hazard: Hazard = body.hazard === "dengue" ? "dengue" : "covid";
  const date = body.date ?? "2023-11-13";
  if (messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      messages: [
        { role: "system", content: buildChatSystemPrompt(lang, hazard, date) },
        ...messages.map((m) => ({ role: m.role, content: m.text })),
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "OrcaReply", schema: replySchema, strict: true },
      },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      reply: string;
      videoId: string | null;
      severity: "info" | "caution" | "urgent" | "emergency";
    };
    return NextResponse.json(parsed);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "chat failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
