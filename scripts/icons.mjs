// Generate PWA icons from the CARA mascot (the "cheer" face) using sharp.
// Run:  node scripts/icons.mjs   → writes PNGs into public/icons/
//
// Produces: standard 192/512, maskable 192/512 (extra padding for the safe
// zone Android crops to), an Apple touch icon (180), and a 32px favicon.

import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BG = "#e3f2fd"; // app background — keeps the icon on-brand
const OUT = "public/icons";

// The mascot art (cheer variant), lifted 1:1 from components/Mascot.tsx,
// as a static SVG fragment in its native 180×170 viewBox.
const MASCOT = `
  <ellipse cx="34" cy="104" rx="13" ry="16" fill="#4f8bd6"/>
  <ellipse cx="146" cy="104" rx="13" ry="16" fill="#4f8bd6"/>
  <ellipse cx="90" cy="90" rx="58" ry="60" fill="#5b9be8"/>
  <ellipse cx="73" cy="150" rx="13" ry="9" fill="#eef4fd"/>
  <ellipse cx="107" cy="150" rx="13" ry="9" fill="#eef4fd"/>
  <ellipse cx="90" cy="84" rx="43" ry="41" fill="#ffffff"/>
  <ellipse cx="60" cy="96" rx="7" ry="4.5" fill="#f4a0b4" opacity="0.8"/>
  <ellipse cx="120" cy="96" rx="7" ry="4.5" fill="#f4a0b4" opacity="0.8"/>
  <circle cx="70" cy="82" r="4" fill="#1b1b1b"/>
  <circle cx="110" cy="82" r="4" fill="#1b1b1b"/>
  <circle cx="71.4" cy="80.7" r="1.3" fill="#fff"/>
  <circle cx="111.4" cy="80.7" r="1.3" fill="#fff"/>
  <path d="M78 96 Q90 112 102 96" stroke="#1b1b1b" stroke-width="3.2" fill="none" stroke-linecap="round"/>
`;

// Square icon SVG at `size` px. `frac` = how much of the tile the mascot fills
// (smaller for maskable, so it sits inside the crop-safe centre).
function iconSvg(size, frac) {
  const w = size * frac;
  const x = (size - w) / 2;
  const y = (size - w) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <svg x="${x}" y="${y}" width="${w}" height="${w}" viewBox="0 0 180 170" preserveAspectRatio="xMidYMid meet">${MASCOT}</svg>
</svg>`;
}

async function png(size, frac, name) {
  const buf = await sharp(Buffer.from(iconSvg(size, frac))).png().toBuffer();
  await fs.writeFile(path.join(process.cwd(), OUT, name), buf);
  console.log(`✓ ${name} (${size}px)`);
}

async function main() {
  await fs.mkdir(path.join(process.cwd(), OUT), { recursive: true });
  await png(192, 0.8, "icon-192.png");
  await png(512, 0.8, "icon-512.png");
  await png(192, 0.6, "icon-maskable-192.png");
  await png(512, 0.6, "icon-maskable-512.png");
  await png(180, 0.82, "apple-touch-icon.png");
  await png(32, 0.86, "favicon-32.png");
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("✗ Failed:", e?.message ?? e);
  process.exit(1);
});
