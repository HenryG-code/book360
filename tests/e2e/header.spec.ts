import { expect, test } from "@playwright/test";

// The header puts booking first: a "Book a room" button in the centre of every page.

for (const path of ["/", "/stays", "/stays/glass-house"]) {
  test(`${path}: Book a room sits in the centre and opens the search`, async ({ page }) => {
    await page.goto(path);
    const book = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /Book a room/ });
    await expect(book).toBeVisible();
    const box = (await book.boundingBox())!;
    const viewport = page.viewportSize()!;
    // Its middle is within 8% of the screen's middle, on every screen size.
    expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(viewport.width * 0.08);
    // Big enough for a thumb.
    expect(box.height).toBeGreaterThanOrEqual(44);
    await book.click();
    await expect(page).toHaveURL(/\/stays$/);
  });
}

test("the header never pushes the page sideways", async ({ page }) => {
  await page.goto("/");
  const header = (await page.getByRole("navigation", { name: "Main" }).boundingBox())!;
  expect(header.x + header.width).toBeLessThanOrEqual(page.viewportSize()!.width);
});

test("the surprise button opens a random stay", async ({ page, isMobile }) => {
  await page.goto("/");
  // Phones keep it in the menu, so the header's centre stays centred.
  if (isMobile) await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("link", { name: /Surprise me/ }).click();
  await expect(page).toHaveURL(/\/stays\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reserve", exact: true }).first()).toBeAttached();
});

test("the header spans the whole width of the screen", async ({ page }) => {
  await page.goto("/stays");
  const nav = (await page.getByRole("navigation", { name: "Main" }).boundingBox())!;
  expect(nav.width).toBeGreaterThanOrEqual(page.viewportSize()!.width - 1);
});

test("My bookings shows how many bookings are saved", async ({ page, isMobile }) => {
  test.skip(isMobile, "the count sits in the wide-screen header; phones reach bookings through the menu");
  await page.goto("/");
  const myBookings = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /My bookings/ });
  await expect(myBookings).toHaveText("My bookings");
  // Two saved bookings, stored the way the booking flow stores them.
  await page.evaluate(() => localStorage.setItem("book360.bookings.v1", JSON.stringify([{ reference: "A" }, { reference: "B" }])));
  await page.reload();
  await expect(myBookings).toHaveAccessibleName(/My bookings\s*2 bookings/);
});
