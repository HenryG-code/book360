import { expect, test, type Page } from "@playwright/test";

// End-to-end tests: a real browser opens the built site and does what a visitor would do.
// Each test checks a promise the site makes, not how the code happens to be written.

const STAY = "/stays/cliffside-suite";

/** Every address the browser asked for since the page opened. */
function recordRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on("request", (request) => urls.push(request.url()));
  return urls;
}

const isPanorama = (url: string) => url.includes("-pano.jpg");

test.describe("home page", () => {
  test("shows the headline, the demo notice and all three stays", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Know the Room Before You Book" })).toBeVisible();
    await expect(page.getByText("Demo site. Stays, prices and bookings are simulated.")).toBeVisible();
    for (const name of ["Cliffside Suite", "Glass House", "City Room"]) {
      await expect(page.getByRole("link", { name: `View stay: ${name}` })).toBeVisible();
    }
  });

  test("a stay link opens that stay", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "View stay: Glass House" }).click();
    await expect(page).toHaveURL(/\/stays\/glass-house$/);
    await expect(page.getByRole("heading", { level: 1, name: "Glass House" })).toBeVisible();
  });

  test("a question opens to show its answer", async ({ page }) => {
    await page.goto("/");
    const answer = page.getByText("The booking page is a placeholder.");
    await expect(answer).toBeHidden();
    await page.getByText("Can I actually book a room?").click();
    await expect(answer).toBeVisible();
  });
});

test.describe("360° tour", () => {
  test("downloads nothing for the tour until the visitor asks for it", async ({ page }) => {
    const urls = recordRequests(page);
    await page.goto(STAY, { waitUntil: "networkidle" });
    expect(urls.filter(isPanorama)).toEqual([]);

    await page.getByRole("button", { name: /Open 360° tour/ }).click();
    await expect(page.getByRole("button", { name: "Close tour" })).toBeVisible();
    expect(urls.filter(isPanorama).length).toBeGreaterThan(0);
    await expect(page.locator("canvas")).toBeVisible();
    await expect(page.getByText("About this tour.")).toBeVisible();
  });

  test("can be looked around and closed with the keyboard", async ({ page }) => {
    await page.goto(STAY);
    await page.getByRole("button", { name: /Open 360° tour/ }).click();
    await expect(page.getByRole("button", { name: "Close tour" })).toBeVisible();

    const tour = page.getByRole("application");
    await tour.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Escape");

    // Closing puts the visitor back on the button they started from.
    const open = page.getByRole("button", { name: /Open 360° tour/ });
    await expect(open).toBeVisible();
    await expect(open).toBeFocused();
  });

  test("without WebGL the visitor gets a message, the photos and a way to book", async ({ page }) => {
    const urls = recordRequests(page);
    // ?webgl=off makes the site behave as if the browser had no WebGL.
    await page.goto(`${STAY}?webgl=off`);
    await page.getByRole("button", { name: /Open 360° tour/ }).click();

    await expect(page.getByText("The 360° tour cannot run in this browser.")).toBeVisible();
    expect(urls.filter(isPanorama)).toEqual([]);
    await expect(page.locator("#photos img")).toHaveCount(3);
    await expect(page.getByRole("link", { name: "Reserve", exact: true })).toBeVisible();
  });
});

test.describe("booking", () => {
  test("is reachable from a stay without the tour ever loading", async ({ page }) => {
    const urls = recordRequests(page);
    await page.goto(STAY);
    await page.getByRole("link", { name: "Reserve", exact: true }).click();

    await expect(page).toHaveURL(/\/stays\/cliffside-suite\/book$/);
    await expect(page.getByRole("heading", { level: 1, name: "Reserve Cliffside Suite" })).toBeVisible();
    await expect(page.getByText("nothing on this page reserves a room or takes a payment")).toBeVisible();
    expect(urls.filter(isPanorama)).toEqual([]);
  });
});

test.describe("honesty and layout", () => {
  test("the stay page says the photographs are real and the stay is invented", async ({ page }) => {
    await page.goto(STAY);
    await expect(page.getByText("Real photographs, invented stay.")).toBeVisible();
    await expect(page.locator("#photos").getByRole("link", { name: /Source: Poly Haven/ })).toBeVisible();
  });

  test("the credits page lists every photograph", async ({ page }) => {
    await page.goto("/credits");
    await expect(page.getByRole("heading", { level: 1, name: "Photo Credits" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "CC0 1.0" })).toHaveCount(4);
  });

  for (const path of ["/", STAY, `${STAY}/book`, "/credits"]) {
    test(`${path} never scrolls sideways`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

// Most visitors browse on a phone, so these check the things a phone needs. "isMobile" is true in the
// two phone projects, and each test skips itself on desktop.
test.describe("on a phone", () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(!isMobile, "phone layout only");
  });

  test("the menu opens and leads to a section", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Questions" });
    await expect(link).toBeHidden();
    await page.getByText("Menu").tap();
    await link.tap();
    await expect(page).toHaveURL(/#questions$/);
  });

  test("Reserve stays on screen while scrolling a stay", async ({ page }) => {
    await page.goto(STAY);
    await page.locator("#photos").scrollIntoViewIfNeeded();
    const reserve = page.getByRole("link", { name: "Reserve", exact: true });
    await expect(reserve).toBeInViewport();
    await reserve.tap();
    await expect(page).toHaveURL(/\/book$/);
  });

  test("the tour opens by touch and shows its controls", async ({ page }) => {
    await page.goto(STAY);
    await page.getByRole("button", { name: /Open 360° tour/ }).tap();
    for (const name of ["Look left", "Look right", "Close tour"]) {
      await expect(page.getByRole("button", { name })).toBeVisible();
    }
  });

  for (const path of ["/", STAY]) {
    test(`${path} has buttons and links big enough for a finger`, async ({ page }) => {
      await page.goto(path);
      // Links inside a sentence are exempt: they cannot be taller than the line of text they sit in.
      const tooSmall = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("a, button, summary")]
          .filter((element) => !element.closest("p"))
          .map((element) => ({ text: (element.textContent ?? "").trim().slice(0, 30), box: element.getBoundingClientRect() }))
          .filter(({ box }) => box.width > 0 && box.height < 44)
          .map(({ text, box }) => `${text} (${Math.round(box.height)}px)`),
      );
      expect(tooSmall).toEqual([]);
    });
  }
});
