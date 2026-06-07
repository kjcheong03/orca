// Generate the app icon set from ORCA's mascot (the same "hooded blob" rendered
// on the homepage). Run once: `node scripts/gen-icons.mjs`.
//
// - Browser favicon + "any"-purpose PWA icons: TRANSPARENT background.
// - Apple touch + maskable icons: filled light background, because iOS renders
//   transparent touch icons on a black tile and maskable icons are spec'd to be
//   full-bleed. Same mascot, just on the app's #e3f2fd background.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");

// The calm mascot, traced 1:1 from components/Mascot.tsx (no float, no ground
// shadow). Its art occupies roughly x:21–159, y:30–159 in this coord space.
const MASCOT = `
  <ellipse cx="34" cy="104" rx="13" ry="16" fill="#4f8bd6"/>
  <ellipse cx="146" cy="104" rx="13" ry="16" fill="#4f8bd6"/>
  <ellipse cx="90" cy="90" rx="58" ry="60" fill="#5b9be8"/>
  <ellipse cx="73" cy="150" rx="13" ry="9" fill="#eef4fd"/>
  <ellipse cx="107" cy="150" rx="13" ry="9" fill="#eef4fd"/>
  <ellipse cx="90" cy="84" rx="43" ry="41" fill="#ffffff"/>
  <ellipse cx="60" cy="96" rx="7" ry="4.5" fill="#f4a0b4" opacity="0.8"/>
  <ellipse cx="120" cy="96" rx="7" ry="4.5" fill="#f4a0b4" opacity="0.8"/>
  <path d="M64 84 Q70 78 76 84" stroke="#1b1b1b" stroke-width="3.4" fill="none" stroke-linecap="round"/>
  <path d="M104 84 Q110 78 116 84" stroke="#1b1b1b" stroke-width="3.4" fill="none" stroke-linecap="round"/>
  <path d="M81 98 Q90 107 99 98" stroke="#1b1b1b" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;

// Transparent: viewBox cropped tight to the mascot (centre 90,94.5; ~150 square
// with a few px of breathing room) so it fills the favicon instead of floating
// in empty space. Padded: mascot inside a filled square with a safe-zone margin
// so masking/rounding (iOS, Android) never clips the face.
const transparentSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="14 18.5 152 152">${MASCOT}</svg>`;
const paddedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">` +
  `<rect width="180" height="180" fill="#e3f2fd"/>` +
  `<g transform="translate(90,90) scale(0.86) translate(-90,-94.5)">${MASCOT}</g></svg>`;

const targets = [
  { file: "favicon-32.png", size: 32, svg: transparentSvg },
  { file: "icon-192.png", size: 192, svg: transparentSvg },
  { file: "icon-512.png", size: 512, svg: transparentSvg },
  { file: "apple-touch-icon.png", size: 180, svg: paddedSvg },
  { file: "icon-maskable-192.png", size: 192, svg: paddedSvg },
  { file: "icon-maskable-512.png", size: 512, svg: paddedSvg },
];

await mkdir(outDir, { recursive: true });
for (const { file, size, svg } of targets) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(outDir, file));
  console.log(`✓ ${file} (${size}×${size})`);
}
console.log("Done →", outDir);
