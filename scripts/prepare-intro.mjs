// Turns the rendered intro frames into the small images the home page plays while scrolling.
//
// Blender renders 150 square PNG frames of 1200 pixels (brand/intro/build_intro.py). That is about
// 30 MB, far too much for a web page, so this script makes two lighter sets:
//
//   lg  every frame, 800 px wide, for large screens
//   sm  every second frame, 520 px wide, for phones: half the downloads and a third of the memory
//
// Frames keep their transparency, so the page's own background colour shows through and there is never
// a visible edge around the animation. Lossy WebP with a separate alpha channel keeps each frame small.
//
// Run with: npm run media:intro (after rendering the frames with Blender)

import { readdir, mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "media-src", "intro");
const OUT = path.join(ROOT, "public", "media", "intro");
const MANIFEST = path.join(ROOT, "src", "data", "intro-frames.json");

const SETS = [
  { name: "lg", size: 800, step: 1, quality: 74 },
  { name: "sm", size: 520, step: 2, quality: 72 },
];

const sources = (await readdir(SOURCE)).filter((file) => /^frame_\d{4}\.png$/.test(file)).sort();
if (sources.length === 0) throw new Error("No frames found. Render them first: see brand/intro/build_intro.py.");

const manifest = {};
for (const set of SETS) {
  const dir = path.join(OUT, set.name);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const picked = sources.filter((_, index) => index % set.step === 0);
  // Always end on the last frame, so the animation finishes on the logo's pose.
  if (picked.at(-1) !== sources.at(-1)) picked.push(sources.at(-1));

  let bytes = 0;
  for (const [index, file] of picked.entries()) {
    const target = path.join(dir, `${String(index).padStart(3, "0")}.webp`);
    await sharp(path.join(SOURCE, file))
      .resize(set.size, set.size)
      .webp({ quality: set.quality, alphaQuality: 80, effort: 5 })
      .toFile(target);
    bytes += (await stat(target)).size;
  }
  manifest[set.name] = { count: picked.length, size: set.size, path: `/media/intro/${set.name}` };
  console.log(`${set.name}: ${picked.length} frames, ${(bytes / 1024).toFixed(0)} KB in total`);
}

// The last frame alone, as the still image shown before the animation loads and to anyone who has
// asked their device to reduce motion.
await sharp(path.join(SOURCE, sources.at(-1))).resize(800, 800).webp({ quality: 80, alphaQuality: 85 }).toFile(path.join(OUT, "poster.webp"));
manifest.poster = "/media/intro/poster.webp";

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Wrote ${path.relative(ROOT, MANIFEST)}`);
