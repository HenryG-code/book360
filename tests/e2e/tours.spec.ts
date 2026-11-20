import { expect, test } from "@playwright/test";
import sharp from "sharp";

// Every 360-degree tour on the site opens and shows a real picture: all 23 rooms and the 3 bathrooms.
// A tour that fails would show the photo fallback, which is safe, but it would be a broken promise.

test("every tour opens and draws its photograph", async ({ page, isMobile }) => {
  test.skip(isMobile, "the tours run once, at desktop size");
  test.setTimeout(300_000);
  const stays: string[] = [];
  for (const pageNumber of [1, 2]) {
    await page.goto(`/stays?page=${pageNumber}`);
    stays.push(...(await page.locator("main ul > li a").evaluateAll((links) => links.map((a) => a.getAttribute("href")!))));
  }
  expect(stays.length).toBeGreaterThan(20);

  const broken: string[] = [];
  let tours = 0;
  for (const stay of stays) {
    await page.goto(stay, { waitUntil: "networkidle" });
    const tabs = await page.getByRole("tab").count();
    for (let tab = 0; tab < Math.max(1, tabs); tab++) {
      if (tabs > 0) await page.getByRole("tab").nth(tab).click();
      await page.getByRole("button", { name: /Open 360° tour/ }).click();
      const opened = await page
        .getByRole("button", { name: "Close tour" })
        .waitFor({ timeout: 20_000 })
        .then(() => true, () => false);
      // A screenshot of the tour must contain a real picture: many different colours, not a flat fill.
      await page.waitForTimeout(500);
      const { data } = await sharp(await page.getByRole("application").screenshot()).resize(32, 32).raw().toBuffer({ resolveWithObject: true });
      const colours = new Set<string>();
      for (let i = 0; i < data.length; i += 3) colours.add(`${data[i]! >> 4},${data[i + 1]! >> 4},${data[i + 2]! >> 4}`);
      if (!opened || colours.size <= 20) broken.push(`${stay}${tabs ? ` (tab ${tab + 1})` : ""}: opened=${opened}, colours=${colours.size}`);
      tours++;
      if (opened) await page.getByRole("button", { name: "Close tour" }).click();
    }
  }
  expect(broken).toEqual([]);
  expect(tours).toBe(26);
});
