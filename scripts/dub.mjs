// Pre-render dubbed audio tracks for the self-test-kit tutorial.
//
//   transcribe (gpt-4o-transcribe) -> translate (gpt-4o-mini)
//   -> speak (gpt-4o-mini-tts) -> public/videos/<id>.<lang>.mp3
//
// Run once locally:  node scripts/dub.mjs
// English is the source — it plays the original audio, no MP3 is made.
//
// The MP3s are committed and served from /public, so playback needs no key.
// When you move to Supabase later, upload these same files to a bucket and
// point VideoResource's dub src at the bucket URLs — the pipeline is unchanged.

import { promises as fs } from "node:fs";
import path from "node:path";
import OpenAI, { toFile } from "openai";

const VIDEO_ID = "self-test-kit";
const SRC = "public/videos/self-test-kit.mp4";
const OUT_DIR = "public/videos";

const TRANSCRIBE_MODEL = "gpt-4o-transcribe";
const TRANSLATE_MODEL = "gpt-4o-mini";
const TTS_MODEL = "gpt-4o-mini-tts";
const TTS_VOICE = "marin"; // high-quality; falls back to alloy if unavailable
const TTS_SPEED = 1.1;
const TTS_CHAR_BUDGET = 3500; // safe under the 4096 hard limit

// Target languages (codes match lib/types Language). English is the source.
const TARGETS = [
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "tl", label: "Tagalog (Filipino)" },
  { code: "zh", label: "Simplified Chinese (中文)" },
  { code: "my", label: "Burmese (မြန်မာ, Unicode — never Zawgyi)" },
];

// Read OPENAI_API_KEY straight from .env.local (this is a plain Node script,
// so Next's env loading doesn't apply).
async function loadKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const env = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf8");
  const line = env.split(/\r?\n/).find((l) => l.startsWith("OPENAI_API_KEY="));
  if (!line) throw new Error("OPENAI_API_KEY not found in .env.local");
  return line.slice("OPENAI_API_KEY=".length).trim();
}

async function ttsToBuffer(client, input) {
  const attempt = (voice, withSpeed) =>
    client.audio.speech.create({
      model: TTS_MODEL,
      voice,
      input,
      response_format: "mp3",
      ...(withSpeed ? { speed: TTS_SPEED } : {}),
    });
  let speech;
  try {
    speech = await attempt(TTS_VOICE, true);
  } catch {
    try {
      speech = await attempt(TTS_VOICE, false);
    } catch {
      speech = await attempt("alloy", false); // last-resort, always-valid voice
    }
  }
  return Buffer.from(await speech.arrayBuffer());
}

function splitForTts(text, budget) {
  if (text.length <= budget) return [text];
  const sentences = text
    .split(/(?<=[.!?…。！？။])\s+/)
    .filter((s) => s.trim().length > 0);
  const out = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + " " + s).length > budget && cur) {
      out.push(cur.trim());
      cur = s;
    } else {
      cur = cur ? `${cur} ${s}` : s;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

async function main() {
  const client = new OpenAI({ apiKey: await loadKey() });
  const srcAbs = path.join(process.cwd(), SRC);
  const mp4 = await fs.readFile(srcAbs);
  await fs.mkdir(path.join(process.cwd(), OUT_DIR), { recursive: true });

  console.log("→ Transcribing source audio…");
  const transcription = await client.audio.transcriptions.create({
    model: TRANSCRIBE_MODEL,
    file: await toFile(mp4, `${VIDEO_ID}.mp4`, { type: "video/mp4" }),
    language: "en",
  });
  const sourceText = (transcription.text ?? "").trim();
  console.log("\n===== TRANSCRIPT =====\n" + (sourceText || "(empty)") + "\n======================\n");
  if (!sourceText) {
    console.error(
      "✗ No speech found — the video likely has no English narration (captions/music only).\n" +
        "  Dubbing needs spoken narration. Stop here and tell me; we'll switch approach."
    );
    process.exit(1);
  }

  for (const { code, label } of TARGETS) {
    process.stdout.write(`→ ${code} (${label}) … `);
    const completion = await client.chat.completions.create({
      model: TRANSLATE_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `Translate the user message to ${label}. Output ONLY the translation in plain prose — no quotes, no preface, no explanation, no transliteration. Preserve numbers, brand names, and medical/anatomical English terms when there is no everyday equivalent. Keep sentence boundaries close to the source so the dubbed timing tracks the video.`,
        },
        { role: "user", content: sourceText },
      ],
    });
    const translated = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!translated) {
      console.log("✗ translation empty, skipped");
      continue;
    }
    const parts = splitForTts(translated, TTS_CHAR_BUDGET);
    const mp3 = Buffer.concat(
      await Promise.all(parts.map((p) => ttsToBuffer(client, p)))
    );
    const outPath = path.join(process.cwd(), OUT_DIR, `${VIDEO_ID}.${code}.mp3`);
    await fs.writeFile(outPath, mp3);
    console.log(`✓ ${(mp3.length / 1024).toFixed(0)} KB → ${OUT_DIR}/${VIDEO_ID}.${code}.mp3`);
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("\n✗ Failed:", e?.message ?? e);
  process.exit(1);
});
