// Bake each dubbed audio track into the video, producing one MP4 per language
// whose ONLY audio is that language. The player then has a single audio source,
// so native mute / unmute / volume control the selected language directly — no
// overlaid <audio>, no sync, no double-audio.
//
// Run after scripts/dub.mjs:  node scripts/mux-dubs.mjs
// Needs the source mp4 + <lang>.mp3 in public/videos (kept on disk locally).

import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const DIR = "public/videos";
const BASE = "self-test-kit";
const LANGS = ["id", "ms", "tl", "zh", "my"];

function run(args) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(err.slice(-500)))));
  });
}

async function main() {
  const dir = path.join(process.cwd(), DIR);
  const video = path.join(dir, `${BASE}.mp4`);

  for (const lang of LANGS) {
    const audio = path.join(dir, `${BASE}.${lang}.mp3`);
    const out = path.join(dir, `${BASE}.${lang}.mp4`);
    process.stdout.write(`→ ${lang} … `);
    // Copy the video stream as-is, replace audio with the dub (re-encoded to
    // AAC for MP4). No -shortest, so the full video is always preserved.
    await run([
      "-y",
      "-i", video,
      "-i", audio,
      "-map", "0:v:0",
      "-map", "1:a:0",
      "-c:v", "copy",
      "-c:a", "aac",
      "-b:a", "128k",
      out,
    ]);
    const { size } = await fs.stat(out);
    console.log(`✓ ${(size / 1024 / 1024).toFixed(1)} MB → ${DIR}/${BASE}.${lang}.mp4`);
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("\n✗ Failed:", e?.message ?? e);
  process.exit(1);
});
