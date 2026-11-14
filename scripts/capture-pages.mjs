// Takes a full-page picture of every page at a desktop and a phone width, for checking the design by eye.
//
// Why this exists: automated tests can prove a button works, but not that a page looks right. Looking at
// whole-page pictures side by side is the quickest way to spot uneven spacing, a heading that wraps
// badly or a phone layout that breaks. This is a looking aid, not a test: it never fails.
//
// Start the site first (npm run dev), then run:  npm run qa:screens
// Another address or folder:                     npm run qa:screens -- http://localhost:3000 some-folder

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "@playwright/test";

const baseURL = process.argv[2] ?? "http://localhost:3000";
const outDir = path.resolve(process.argv[3] ?? "test-results/screens");

const PAGES = [
  ["home", "/"],
  ["stay", "/stays/cliffside-suite"],
  ["stay-glass-house", "/stays/glass-house"],
  ["book", "/stays/cliffside-suite/book"],
  ["credits", "/credits"],
];

const SIZES = [
  ["desktop", { viewport: { width: 1440, height: 900 } }],
  ["phone", devices["Pixel 7"]],
  // The narrowest phones still in common use. If a layout survives 360 pixels, it survives the rest.
  ["small-phone", { ...devices["Pixel 7"], viewport: { width: 360, height: 740 } }],
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

for (const [sizeName, options] of SIZES) {
  const context = await browser.newContext({ ...options, reducedMotion: "reduce" });
  const page = await context.newPage();
  for (const [name, url] of PAGES) {
    await page.goto(baseURL + url, { waitUntil: "networkidle" });
    // Images below the fold only load when scrolled near, so walk down the page before the picture.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle");
    const file = path.join(outDir, `${name}-${sizeName}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(path.relative(process.cwd(), file));
  }
  await context.close();
}

await browser.close();
