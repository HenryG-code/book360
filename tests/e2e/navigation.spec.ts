import { expect, test, type Page } from "@playwright/test";

// Links to sections of the home page ("The idea", "How it works") must land on their section every
// time, from anywhere. These tests cover the situations that used to fail:
//   - clicking a link when the address already ends in the same #section did nothing
//   - on phones the menu stayed open over the section it had just scrolled to

const SECTIONS = [
  { label: "How it works", id: "how" },
  { label: "The idea", id: "idea" },
];

/** Click a header link: in the row of links on wide screens, or through the menu on phones. */
async function clickNav(page: Page, label: string, isMobile: boolean) {
  if (isMobile) {
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: label }).click();
  } else {
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: label }).click();
  }
}

/** Passes once the section's top is near the top of the screen, after smooth scrolling has stopped. */
async function expectAtSection(page: Page, id: string) {
  // Distance from the top of the screen, either way: while smooth scrolling runs upwards the section is
  // still far above, so checking only "not below the top" would pass too early.
  await expect
    .poll(async () => page.evaluate((target) => Math.round(Math.abs(document.getElementById(target)!.getBoundingClientRect().top)), id), {
      message: `#${id} should reach the top of the screen`,
      timeout: 6_000,
    })
    .toBeLessThanOrEqual(60);
  // Never left behind covering the page.
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
}

for (const { label, id } of SECTIONS) {
  test.describe(`"${label}" link`, () => {
    test("lands on its section from the top of the home page", async ({ page, isMobile }) => {
      await page.goto("/");
      await clickNav(page, label, isMobile);
      await expectAtSection(page, id);
      await expect(page).toHaveURL(new RegExp(`/#${id}$`));
    });

    test("lands again when clicked a second time after scrolling away", async ({ page, isMobile }) => {
      await page.goto("/");
      await clickNav(page, label, isMobile);
      await expectAtSection(page, id);
      // The address now ends in #section. Scroll away, then use the same link again.
      await page.evaluate(() => window.scrollTo(0, 0));
      await clickNav(page, label, isMobile);
      await expectAtSection(page, id);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await clickNav(page, label, isMobile);
      await expectAtSection(page, id);
    });

    test("lands on its section from another page", async ({ page, isMobile }) => {
      await page.goto("/stays/glass-house");
      await page.evaluate(() => window.scrollTo(0, 1200));
      await clickNav(page, label, isMobile);
      await expect(page).toHaveURL(new RegExp(`/#${id}$`));
      await expectAtSection(page, id);
    });

    test("lands on its section when the address is opened directly", async ({ page }) => {
      await page.goto(`/#${id}`);
      await expectAtSection(page, id);
    });
  });
}

test("the footer's section links land too, and Back returns to where the visitor was", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole("contentinfo").getByRole("link", { name: "How it works" }).click();
  await expectAtSection(page, "how");
  await page.getByRole("contentinfo").getByRole("link", { name: "The idea" }).click();
  await expectAtSection(page, "idea");
  await page.goBack();
  await expect(page).toHaveURL(/\/#how$/);
});

test.describe("phone menu", () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(!isMobile, "the full-screen menu is for phones");
  });

  test("opens full screen, keeps the page still and closes with Escape", async ({ page }) => {
    await page.goto("/");
    const menuButton = page.getByRole("button", { name: "Menu" });
    await menuButton.click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box!.width).toBeGreaterThanOrEqual(viewport.width - 1);
    expect(box!.height).toBeGreaterThanOrEqual(viewport.height - 1);
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(menuButton).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
  });

  test("closes with its Close button", async ({ page }) => {
    await page.goto("/stays");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
  });

  test("fits every link on a short phone without scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 568 });
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    const nav = page.getByRole("dialog", { name: "Menu" }).getByRole("navigation");
    for (const label of ["Book a room", "The idea", "How it works", "For hosts", "My bookings"]) {
      await expect(nav.getByRole("link", { name: label })).toBeInViewport({ ratio: 1 });
    }
    await expect(page.getByRole("link", { name: "Browse every stay" })).toBeInViewport();
  });

  test("its Browse all stays button opens the search", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Browse every stay" }).click();
    await expect(page).toHaveURL(/\/stays$/);
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
  });
});

