import { expect, test } from "@playwright/test";
import { auditPage } from "./helpers/audit";

// Quality checks across every kind of page: accessibility basics, contrast, keyboard focus, page titles,
// the not-found page and how much the home page downloads before anyone scrolls.

const PAGES = ["/", "/stays", "/stays?type=House", "/hosts", "/bookings", "/credits", "/stays/cliffside-suite", "/stays/cliffside-suite/book", "/stays/no-such-stay-1"];

for (const path of PAGES) {
  test(`${path} passes the accessibility and layout checks`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    expect(await auditPage(page)).toEqual([]);
  });
}

test("every stay and booking page passes the checks too", async ({ page, isMobile }) => {
  test.skip(isMobile, "the layout checks for every page run once, at desktop size");
  test.setTimeout(180_000);
  const stays: string[] = [];
  for (const pageNumber of [1, 2]) {
    await page.goto(`/stays?page=${pageNumber}`);
    stays.push(...(await page.locator("main ul > li a").evaluateAll((links) => links.map((a) => a.getAttribute("href")!))));
  }
  const problems: string[] = [];
  for (const stay of stays) {
    for (const path of [stay, `${stay}/book`]) {
      await page.goto(path, { waitUntil: "networkidle" });
      for (const problem of await auditPage(page)) problems.push(`${path}: ${problem}`);
    }
  }
  expect(problems).toEqual([]);
});

test("booking pages name their stay in the browser tab", async ({ page }) => {
  const titles = new Set<string>();
  for (const slug of ["cliffside-suite", "glass-house", "city-room"]) {
    await page.goto(`/stays/${slug}/book`);
    const name = await page.getByRole("heading", { level: 1 }).textContent();
    await expect(page).toHaveTitle(new RegExp(`^${name!.trim()} · Book360$`));
    titles.add(await page.title());
  }
  expect(titles.size).toBe(3);
});

test("keyboard focus is always visible", async ({ page }) => {
  await page.goto("/");
  for (let stop = 1; stop <= 10; stop++) {
    await page.keyboard.press("Tab");
    const shown = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement!);
      return (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) || style.boxShadow !== "none";
    });
    expect(shown, `tab stop ${stop} should show where focus is`).toBe(true);
  }
});

test("an unknown address gets a helpful not-found page", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "This Room Isn't Here" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await page.getByRole("link", { name: "Browse every stay" }).click();
  await expect(page).toHaveURL(/\/stays$/);
});

test("the home page downloads no animation frames until the visitor scrolls", async ({ page }) => {
  const frames: string[] = [];
  page.on("request", (request) => {
    if (/\/media\/intro\/(lg|sm)\//.test(request.url())) frames.push(request.url());
  });
  await page.goto("/", { waitUntil: "networkidle" });
  expect(frames).toEqual([]);
  await page.mouse.wheel(0, 300);
  await expect.poll(() => frames.length, { timeout: 10_000 }).toBeGreaterThan(0);
});
