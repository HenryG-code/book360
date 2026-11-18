import { expect, test } from "@playwright/test";

// A sweep of the whole site, the way a careful visitor would click through it: every page reachable
// from the site's own links (with a sample of stays, since there are thousands), checking for
//   - pages or files that fail to load
//   - links to a #section that does not exist on the page they point to
//   - script errors and console errors
//   - images that never load

const START = ["/", "/stays", "/stays?page=50", "/stays?type=House&guests=8", "/hosts", "/bookings", "/credits", "/stays/cliffside-suite/book"];
const MAX_PAGES = 30;
const MAX_STAYS = 8;

test("every page and link on the site works", async ({ page, baseURL }) => {
  test.setTimeout(240_000);
  const problems: string[] = [];
  let current = "";
  page.on("pageerror", (error) => problems.push(`${current}: script error: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`${current}: console error: ${message.text().slice(0, 160)}`);
  });
  page.on("response", (response) => {
    if (response.url().startsWith(baseURL!) && response.status() >= 400) {
      problems.push(`${current}: HTTP ${response.status()} for ${response.url().replace(baseURL!, "")}`);
    }
  });

  const queue = [...START];
  const seen = new Set<string>();
  const sectionsByPage = new Map<string, Set<string>>();
  const hashLinks: { from: string; page: string; id: string }[] = [];

  while (queue.length > 0 && seen.size < MAX_PAGES) {
    const path = queue.shift()!;
    if (seen.has(path)) continue;
    seen.add(path);
    current = path;
    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response?.status(), `${path} should load`).toBeLessThan(400);

    // Walk down the page so images further down load, then check every image arrived.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    });
    await page.waitForLoadState("networkidle");
    const brokenImages = await page.evaluate(() =>
      [...document.images].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.currentSrc || img.src),
    );
    for (const src of brokenImages) problems.push(`${path}: image did not load: ${src}`);

    const pathname = path.split("?")[0]!;
    sectionsByPage.set(pathname, new Set(await page.evaluate(() => [...document.querySelectorAll("[id]")].map((el) => el.id))));

    const hrefs = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")!));
    for (const href of hrefs) {
      if (!href.startsWith("/") && !href.startsWith("#")) continue; // mailto: and other sites
      const [target, id] = href.split("#");
      const targetPage = (target || pathname).split("?")[0]!;
      if (id) hashLinks.push({ from: path, page: targetPage, id });
      const next = target || pathname;
      if (seen.has(next) || queue.includes(next)) continue;
      const isStay = /^\/stays\/[^/]+$/.test(next);
      const stays = [...seen, ...queue].filter((p) => /^\/stays\/[^/]+$/.test(p)).length;
      if (!isStay || stays < MAX_STAYS) queue.push(next);
    }
  }

  // Every #section link must point at something that exists on its page.
  for (const link of hashLinks) {
    let ids = sectionsByPage.get(link.page);
    if (!ids) {
      await page.goto(link.page, { waitUntil: "domcontentloaded" });
      ids = new Set(await page.evaluate(() => [...document.querySelectorAll("[id]")].map((el) => el.id)));
      sectionsByPage.set(link.page, ids);
    }
    if (!ids.has(link.id)) problems.push(`${link.from}: link to ${link.page}#${link.id}, which does not exist`);
  }

  expect(seen.size).toBeGreaterThan(15);
  expect([...new Set(problems)]).toEqual([]);
});
