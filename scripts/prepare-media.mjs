// Turns the source 360-degree photographs into the web-sized files in public/media.
//
// Why this exists: a source photograph is 8192 x 4096 pixels and up to 40 MB. That is far too heavy to
// send to a phone, so the originals stay out of the repository (media-src/ is git-ignored) and only the
// small copies made here are committed. Anyone can rebuild them from the same public files.
//
// Each source is an equirectangular image: a 2:1 picture where the horizontal position is a compass
// direction (longitude) and the vertical position is how far up or down you look (latitude). From one
// source this script makes:
//   - a smaller panorama, which the Marzipano viewer wraps around the visitor
//   - flat "normal camera" views cut out of the same photograph, for the gallery and the fallback
//
// Because both come from one photograph, the gallery can never show something the tour does not.
//
// Run with:  npm run media:prepare           (uses the files already in media-src/)
//            npm run media:prepare -- --fetch (downloads any source file that is missing first)

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = path.join(ROOT, "media-src");
const OUT_DIR = path.join(ROOT, "public", "media");

// Every source is a Poly Haven asset released under CC0. The md5 is the one Poly Haven publishes, so a
// cut-off or altered download is caught before it is used. Credits are in CREDITS.md.
const SOURCE_URL = (id) => `https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/${id}.jpg`;
const SOURCES = {
  relax_inn_seaview_suite: "2f5bdca6a5234d8e66ad1bff803a9626",
  glasshouse_interior: "f9bfc47f33ddccbb803baae3db3e0d80",
  hotel_room: "5675e838ff32b9ca8ac8ac4635d3adaf",
  illovo_beach_balcony: "842bcd05fe9a8f929f3a9608144cd48e",
  lythwood_room: "004ed677597376a17b4642f4d6e61883",
  cabin: "d21a0880f656bb81ceea99c879f45ccb",
  brown_photostudio_04: "c19bff53bec5c5352d0ea5c8f022d1af",
  photo_studio_loft_hall: "3456280ca1b1cb80ebe14f257bca296d",
  lythwood_lounge: "482855e7c9d03b260f3ff26c115ad774",
  anniversary_lounge: "3df39e24797865650d33278341d77847",
  combination_room: "2b279b4ca8ffe85a4851c35d81c8aa7d",
  wooden_lounge: "ebcf0bdbabe9ec013091caa4c1535601",
  kiara_interior: "17df3e469b1bfb8e4ef4c29d32bd53aa",
  cayley_interior: "b56ae551991b3cd259cd11f23e4129b5",
};

// Panorama width sent to the browser. 4096 is the largest texture every phone GPU is required to
// accept, so one size works everywhere. Whether it is sharp enough is a slice 0 question for ADR 0001.
const PANO_WIDTH = 4096;
const PHOTO = { width: 1600, height: 1067, fov: 72 };

// yaw: degrees right of the photograph's centre. pitch: degrees up. Chosen by eye from a contact sheet.
const JOBS = [
  {
    source: "relax_inn_seaview_suite",
    slug: "cliffside-suite",
    panorama: true,
    views: [{ yaw: 112, pitch: -6 }, { yaw: 45, pitch: -3 }, { yaw: -150, pitch: -4 }],
  },
  {
    source: "glasshouse_interior",
    slug: "glass-house",
    panorama: true,
    // A flat, wide slice of the panorama for the home page, to show what a 360 photograph looks like unwrapped.
    strip: true,
    views: [
      { yaw: -78, pitch: -4 },
      { yaw: 110, pitch: -6 },
      { yaw: -15, pitch: -2 },
      // A wide band for the home page: the valley seen through the windows.
      { name: "valley", yaw: 40, pitch: 3, fov: 84, width: 2400, height: 1100 },
    ],
  },
  {
    source: "hotel_room",
    slug: "city-room",
    panorama: true,
    views: [{ yaw: 112, pitch: -8 }, { yaw: -18, pitch: -14 }, { yaw: -72, pitch: -6 }],
  },
  // Ten more rooms, added to test the catalogue with a wider set of photographs.
  { source: "lythwood_room", slug: "twin-room", panorama: true, views: [{ yaw: -160, pitch: -8 }, { yaw: 25, pitch: -4 }, { yaw: 112, pitch: -6 }] },
  { source: "cabin", slug: "ship-cabin", panorama: true, views: [{ yaw: -175, pitch: -8 }, { yaw: -70, pitch: -6 }, { yaw: 90, pitch: -6 }] },
  { source: "brown_photostudio_04", slug: "bright-studio", panorama: true, views: [{ yaw: -15, pitch: -8 }, { yaw: 45, pitch: -4 }, { yaw: 150, pitch: -6 }] },
  { source: "photo_studio_loft_hall", slug: "green-loft", panorama: true, views: [{ yaw: -70, pitch: -6 }, { yaw: 45, pitch: -4 }, { yaw: -20, pitch: -6 }] },
  { source: "lythwood_lounge", slug: "country-lounge", panorama: true, views: [{ yaw: -135, pitch: -8 }, { yaw: 70, pitch: -6 }, { yaw: 100, pitch: -6 }] },
  { source: "anniversary_lounge", slug: "garden-lounge", panorama: true, views: [{ yaw: 140, pitch: -8 }, { yaw: -90, pitch: -6 }, { yaw: -20, pitch: -6 }] },
  { source: "combination_room", slug: "parlour", panorama: true, views: [{ yaw: -75, pitch: -6 }, { yaw: 45, pitch: -2 }, { yaw: -150, pitch: -6 }] },
  { source: "wooden_lounge", slug: "timber-lounge", panorama: true, views: [{ yaw: -22, pitch: -8 }, { yaw: 45, pitch: -4 }, { yaw: 150, pitch: -8 }] },
  { source: "kiara_interior", slug: "mountain-flat", panorama: true, views: [{ yaw: -10, pitch: -4 }, { yaw: 70, pitch: -10 }, { yaw: -150, pitch: -6 }] },
  { source: "cayley_interior", slug: "lake-house", panorama: true, views: [{ yaw: -140, pitch: -8 }, { yaw: -10, pitch: -4 }, { yaw: -80, pitch: -6 }] },
  {
    source: "illovo_beach_balcony",
    slug: "home",
    panorama: false,
    views: [
      { name: "hero", yaw: 150, pitch: 9, fov: 86, width: 2400, height: 1500 },
      { name: "coast", yaw: 160, pitch: 7, fov: 64, width: 2400, height: 1300 },
    ],
  },
];

const rad = (degrees) => (degrees * Math.PI) / 180;

async function ensureSource(id, fetchMissing) {
  const file = path.join(SRC_DIR, `${id}.jpg`);
  if (!existsSync(file)) {
    if (!fetchMissing) {
      throw new Error(`Missing ${path.relative(ROOT, file)}. Run "npm run media:prepare -- --fetch" to download it.`);
    }
    console.log(`Downloading ${id}.jpg ...`);
    const response = await fetch(SOURCE_URL(id), { headers: { "User-Agent": "book360-media-script" } });
    if (!response.ok) throw new Error(`Download failed for ${id}: HTTP ${response.status}`);
    await mkdir(SRC_DIR, { recursive: true });
    await writeFile(file, Buffer.from(await response.arrayBuffer()));
  }
  const md5 = createHash("md5").update(await readFile(file)).digest("hex");
  if (md5 !== SOURCES[id]) throw new Error(`${id}.jpg does not match its published checksum. Delete it and fetch again.`);
  return file;
}

/**
 * Cut a flat view out of an equirectangular image.
 *
 * For every pixel of the output we work out which direction a normal camera would be looking through
 * that pixel, turn that direction into longitude and latitude, and read the colour found there in the
 * source. Blending the four nearest source pixels (bilinear sampling) avoids jagged edges.
 */
function cutView(source, { yaw, pitch, fov, width, height }) {
  const { data, width: sw, height: sh } = source;
  const out = Buffer.alloc(width * height * 3);
  const focal = width / 2 / Math.tan(rad(fov) / 2);
  const [cy, sy, cp, sp] = [Math.cos(rad(yaw)), Math.sin(rad(yaw)), Math.cos(rad(pitch)), Math.sin(rad(pitch))];

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      // Direction through this pixel for a camera looking straight ahead (z forward, y up).
      const x = i + 0.5 - width / 2;
      const y = height / 2 - (j + 0.5);
      // Tilt up or down by pitch, then turn left or right by yaw.
      const y1 = y * cp + focal * sp;
      const z1 = -y * sp + focal * cp;
      const dx = x * cy + z1 * sy;
      const dz = -x * sy + z1 * cy;

      const longitude = Math.atan2(dx, dz);
      const latitude = Math.atan2(y1, Math.hypot(dx, dz));
      const u = (longitude / (2 * Math.PI) + 0.5) * sw - 0.5;
      const v = Math.min(sh - 1, Math.max(0, (0.5 - latitude / Math.PI) * sh - 0.5));

      const u0 = Math.floor(u);
      const v0 = Math.floor(v);
      const fu = u - u0;
      const fv = v - v0;
      // Longitude wraps around: the pixel right of the last column is the first column.
      const left = ((u0 % sw) + sw) % sw;
      const right = (left + 1) % sw;
      const below = Math.min(sh - 1, v0 + 1);
      const target = (j * width + i) * 3;
      for (let c = 0; c < 3; c++) {
        const top = data[(v0 * sw + left) * 3 + c] * (1 - fu) + data[(v0 * sw + right) * 3 + c] * fu;
        const bottom = data[(below * sw + left) * 3 + c] * (1 - fu) + data[(below * sw + right) * 3 + c] * fu;
        out[target + c] = Math.round(top * (1 - fv) + bottom * fv);
      }
    }
  }
  return sharp(out, { raw: { width, height, channels: 3 } });
}

// sharp drops EXIF, GPS and other metadata unless asked to keep it, so the published files carry none.
// Progressive JPEGs show a soft full image early instead of filling in from the top.
const jpeg = (image, quality) => image.jpeg({ quality, mozjpeg: true, progressive: true });

const fetchMissing = process.argv.includes("--fetch");
await mkdir(OUT_DIR, { recursive: true });
const written = [];

for (const job of JOBS) {
  const file = await ensureSource(job.source, fetchMissing);
  // toColorspace("srgb") bakes any embedded colour profile into plain sRGB before the profile is dropped.
  const base = sharp(file, { limitInputPixels: false }).toColorspace("srgb").removeAlpha();

  if (job.panorama) {
    const target = path.join(OUT_DIR, `${job.slug}-pano.jpg`);
    await jpeg(base.clone().resize(PANO_WIDTH, PANO_WIDTH / 2), 80).toFile(target);
    written.push(target);
  }

  if (job.strip) {
    const target = path.join(OUT_DIR, `${job.slug}-strip.jpg`);
    await jpeg(base.clone().resize(2000, 1000).extract({ left: 0, top: 230, width: 2000, height: 560 }), 78).toFile(target);
    written.push(target);
  }

  const { data, info } = await base.clone().raw().toBuffer({ resolveWithObject: true });
  const source = { data, width: info.width, height: info.height };
  for (const [index, view] of job.views.entries()) {
    const target = path.join(OUT_DIR, `${job.slug}-${view.name ?? index + 1}.jpg`);
    await jpeg(cutView(source, { ...PHOTO, ...view }), 78).toFile(target);
    written.push(target);
  }
}

let total = 0;
for (const target of written) {
  const { size } = await stat(target);
  total += size;
  console.log(`${path.basename(target).padEnd(28)} ${String(Math.round(size / 1024)).padStart(5)} KB`);
}
console.log(`${"total".padEnd(28)} ${String(Math.round(total / 1024)).padStart(5)} KB`);
