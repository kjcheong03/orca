// Upload the tutorial video + dubbed audio tracks to Supabase Storage.
//
// Run after generating dubs:  node scripts/upload-media.mjs
// Creates the public "media" bucket if needed and uploads everything under
// public/videos/ to media/videos/. Idempotent (upsert) — safe to re-run.
//
// Uses SUPABASE_SERVICE_ROLE_KEY (server-only) from .env.local. The app reads
// the resulting public URLs via NEXT_PUBLIC_SUPABASE_URL — no key at runtime.

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "media";
const LOCAL_DIR = "public/videos";
const REMOTE_PREFIX = "videos";

// English original + poster, plus one baked dubbed MP4 per language (single
// audio track = that language, so native player controls "just work").
const FILES = [
  { name: "self-test-kit.mp4", type: "video/mp4" },
  { name: "self-test-kit.webp", type: "image/webp" },
  { name: "self-test-kit.id.mp4", type: "video/mp4" },
  { name: "self-test-kit.ms.mp4", type: "video/mp4" },
  { name: "self-test-kit.tl.mp4", type: "video/mp4" },
  { name: "self-test-kit.zh.mp4", type: "video/mp4" },
  { name: "self-test-kit.my.mp4", type: "video/mp4" },
];

async function envFromLocal(key) {
  if (process.env[key]) return process.env[key];
  const env = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf8");
  const line = env.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} not found in .env.local`);
  return line.slice(key.length + 1).trim();
}

async function main() {
  const url = await envFromLocal("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = await envFromLocal("SUPABASE_SERVICE_ROLE_KEY");
  const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Ensure a public bucket exists (50 MB/file headroom).
  const { error: bucketErr } = await sb.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 52428800,
  });
  if (bucketErr && !/already exists/i.test(bucketErr.message)) {
    throw new Error(`createBucket failed: ${bucketErr.message}`);
  }
  console.log(`Bucket "${BUCKET}" ready (public).`);

  for (const { name, type } of FILES) {
    const buf = await fs.readFile(path.join(process.cwd(), LOCAL_DIR, name));
    const remote = `${REMOTE_PREFIX}/${name}`;
    const { error } = await sb.storage.from(BUCKET).upload(remote, buf, {
      contentType: type,
      upsert: true,
    });
    if (error) {
      console.log(`✗ ${name}: ${error.message}`);
      continue;
    }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(remote);
    console.log(`✓ ${name} → ${data.publicUrl}`);
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("\n✗ Failed:", e?.message ?? e);
  process.exit(1);
});
