import { expect, test, type Page } from "@playwright/test";
import { takenNights } from "../../src/domain/availability.ts";
import { addDays } from "../../src/domain/dates.ts";

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
    // The first question starts open, so this uses a later one that starts closed.
    const answer = page.getByText("Not yet. In this demo the booking flow");
    await expect(answer).toBeHidden();
    await page.getByText("Can it take real bookings and payments?").click();
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

/** The first run of free nights for a stay, starting a month from now. Uses the site's own availability rule. */
function freeDates(listingId: number, nights: number): { checkIn: string; checkOut: string } {
  let checkIn = addDays(new Date().toISOString().slice(0, 10), 30);
  while (takenNights(listingId, checkIn, addDays(checkIn, nights)).length > 0) checkIn = addDays(checkIn, 1);
  return { checkIn, checkOut: addDays(checkIn, nights) };
}

/** A night somebody else already has, for the same stay. */
function takenDate(listingId: number): string {
  let night = addDays(new Date().toISOString().slice(0, 10), 30);
  while (takenNights(listingId, night, addDays(night, 1)).length === 0) night = addDays(night, 1);
  return night;
}

test.describe("booking", () => {
  test("is reachable from a stay without the tour ever loading", async ({ page }) => {
    const urls = recordRequests(page);
    await page.goto(STAY);
    await page.getByRole("link", { name: "Reserve", exact: true }).click();
    await expect(page).toHaveURL(/\/stays\/cliffside-suite\/book$/);
    await expect(page.getByRole("heading", { level: 1, name: "Reserve Cliffside Suite" })).toBeVisible();
    expect(urls.filter(isPanorama)).toEqual([]);
  });

  test("prices a stay, confirms it, lists it and cancels it", async ({ page }) => {
    const { checkIn, checkOut } = freeDates(1, 2);
    await page.goto(STAY + "/book");
    await page.getByLabel("Check-in").fill(checkIn);
    await page.getByLabel("Check-out").fill(checkOut);

    // Two nights at R 2 850 plus a R 450 cleaning fee.
    await expect(page.getByTestId("total")).toHaveText(/6\s?150/);
    await page.getByText("Where the money goes").click();
    await expect(page.getByText("Book360 keeps 3% of the room charge")).toBeVisible();

    await page.getByRole("button", { name: "Confirm demo booking" }).click();
    await expect(page).toHaveURL(/\/bookings\?new=B360-[0-9A-F]{8}$/);
    await expect(page.getByText("Booking confirmed.")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Cliffside Suite" })).toBeVisible();

    // The booking survives a reload, because it is kept in the browser's storage.
    await page.reload();
    await expect(page.getByRole("heading", { level: 2, name: "Cliffside Suite" })).toBeVisible();

    await page.getByRole("button", { name: "Cancel booking" }).click();
    await page.getByRole("button", { name: "Yes, cancel it" }).click();
    await expect(page.getByText("No Bookings Yet")).toBeVisible();
  });

  test("refuses nights that are already taken", async ({ page }) => {
    const night = takenDate(1);
    await page.goto(STAY + "/book");
    await page.getByLabel("Check-in").fill(night);
    await expect(page.getByText(/Already booked on/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm demo booking" })).toBeDisabled();
  });

  test("the server works the price out itself and rejects bad requests", async ({ request }) => {
    const { checkIn, checkOut } = freeDates(1, 3);
    const good = await request.post("/api/bookings", { data: { slug: "cliffside-suite", checkIn, checkOut, guests: 2, totalMinor: 1 } });
    expect(good.status()).toBe(201);
    // The made-up total of one cent is ignored: 3 nights x R 2 850 + R 450, in cents.
    expect((await good.json()).quote.totalMinor).toBe(900_000);

    const tooMany = await request.post("/api/bookings", { data: { slug: "cliffside-suite", checkIn, checkOut, guests: 99 } });
    expect(tooMany.status()).toBe(400);
    const unknown = await request.post("/api/bookings", { data: { slug: "no-such-stay", checkIn, checkOut, guests: 1 } });
    expect(unknown.status()).toBe(404);
    const taken = takenDate(1);
    const clash = await request.post("/api/bookings", { data: { slug: "cliffside-suite", checkIn: taken, checkOut: addDays(taken, 1), guests: 1 } });
    expect(clash.status()).toBe(409);
  });
});

test.describe("catalogue", () => {
  test("search shows one page at a time", async ({ page }) => {
    await page.goto("/stays");
    await expect(page.getByRole("heading", { level: 1, name: "Find a Stay" })).toBeVisible();
    await expect(page.getByRole("status")).toContainText(/\d+ stays found\. Page 1 of 2/);
    await expect(page.locator("main ul > li")).toHaveCount(12);
  });

  test("no photograph appears on two stays", async ({ page }) => {
    const pictures: string[] = [];
    for (const path of ["/stays", "/stays?page=2"]) {
      await page.goto(path);
      for (const image of await page.locator("main ul > li img").all()) {
        // next/image rewrites the address; the original file name is in its url= parameter.
        const src = (await image.getAttribute("src"))!;
        pictures.push(new URL(src, "http://x").searchParams.get("url") ?? src);
      }
    }
    expect(pictures.length).toBeGreaterThan(15);
    expect(new Set(pictures).size).toBe(pictures.length);
  });

  test("filters go into the address and survive a reload", async ({ page }) => {
    await page.goto("/stays");
    await page.getByLabel("Type").selectOption("House");
    await page.getByLabel("Guests").selectOption("6");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/type=House/);
    await expect(page).toHaveURL(/guests=6/);
    const status = await page.getByRole("status").textContent();
    await page.reload();
    await expect(page.getByRole("status")).toHaveText(status!);
    await expect(page.getByLabel("Type")).toHaveValue("House");
    const cards = await page.locator("main ul > li").all();
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) await expect(card).toContainText("House ·");
  });

  test("paging moves through results and Back returns", async ({ page }) => {
    await page.goto("/stays");
    const firstCard = await page.locator("main ul > li").first().textContent();
    await page.getByRole("link", { name: "Next" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator("main ul > li").first()).not.toHaveText(firstCard!);
    await page.goBack();
    await expect(page.locator("main ul > li").first()).toHaveText(firstCard!);
  });

  test("a nonsense address still gives a working page", async ({ page }) => {
    await page.goto("/stays?page=999999&guests=abc&region=Nowhere&max=-5");
    await expect(page.getByRole("status")).toContainText("stays found");
  });

  test("a generated stay opens with its own tour and booking", async ({ page }) => {
    await page.goto("/stays?sort=price-desc");
    await page.locator("main ul > li a").first().click();
    await expect(page).toHaveURL(/\/stays\/[a-z-]+-\d+$/);
    await expect(page.getByRole("button", { name: /Open 360° tour/ })).toBeVisible();
    await expect(page.getByText("Real photographs, invented stay.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Reserve", exact: true })).toBeVisible();
  });

  test("a stay with a bathroom tour switches between its two rooms", async ({ page }) => {
    const urls = recordRequests(page);
    await page.goto(STAY);
    await expect(page.getByRole("tab", { name: "Bedroom" })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("tab", { name: "Bathroom" }).click();
    await expect(page.getByRole("tab", { name: "Bathroom" })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("button", { name: /Open 360° tour/ }).click();
    await expect(page.getByRole("button", { name: "Close tour" })).toBeVisible();
    expect(urls.some((url) => url.includes("bathroom-classic-pano.jpg"))).toBe(true);
    await expect(page.getByText("a different real place")).toBeVisible();
  });

  test("an unknown stay is a 404", async ({ page }) => {
    const response = await page.goto("/stays/no-such-stay-0");
    expect(response?.status()).toBe(404);
  });
});

test.describe("hosts", () => {
  test("the calculator shows the 3% commission", async ({ page }) => {
    await page.goto("/hosts");
    // The starting values: R 1 800 a night for 14 nights is R 25 200, and 3% of that is R 756.
    await expect(page.getByTestId("commission")).toHaveText(/756/);
    await expect(page.getByTestId("payout")).toHaveText(/24\s?444/);
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
    await expect(page.getByRole("listitem").filter({ hasText: "CC0 1.0" })).toHaveCount(27);
  });

  for (const path of ["/", STAY, `${STAY}/book`, "/credits", "/stays", "/hosts", "/bookings"]) {
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

  test("the menu opens and leads to another page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "For hosts" })).toBeHidden();
    await page.getByRole("button", { name: "Menu" }).tap();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "For hosts" }).tap();
    await expect(page).toHaveURL(/\/hosts$/);
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

  for (const path of ["/", STAY, "/stays", `${STAY}/book`]) {
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

test.describe("intro film", () => {
  test("plays on its own when the section comes into view, once, and can be replayed", async ({ page, isMobile }) => {
    const urls = recordRequests(page);
    await page.goto("/");
    const section = page.locator(".intro-film");
    await expect(page.getByRole("heading", { level: 2, name: "Look Around First, Decide After" })).toBeAttached();

    // One quick scroll straight to the section, the way a fast scroller would arrive.
    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveAttribute("data-state", "playing", { timeout: 10_000 });
    await expect(page.locator(".intro-film-canvas")).toBeVisible();
    // Part-way through, the last word has not arrived yet: the film has its own pace.
    expect(Number(await page.locator(".intro-film-word").last().evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(1);

    await expect(section).toHaveAttribute("data-state", "done", { timeout: 10_000 });
    await expect(page.locator(".intro-film-word").last()).toHaveCSS("opacity", "1");

    // Scrolling away and back does not restart it; the button does.
    await page.evaluate(() => window.scrollTo(0, 0));
    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveAttribute("data-state", "done");
    await page.getByRole("button", { name: /Play again/ }).click();
    await expect(section).toHaveAttribute("data-state", "playing");
    await expect(section).toHaveAttribute("data-state", "done", { timeout: 10_000 });

    // Phones get the smaller set of frames and never download the large one.
    const frames = urls.filter((url) => url.includes("/media/intro/"));
    expect(frames.some((url) => url.includes(isMobile ? "/intro/sm/" : "/intro/lg/"))).toBe(true);
    expect(frames.some((url) => url.includes(isMobile ? "/intro/lg/" : "/intro/sm/"))).toBe(false);
  });

  test("with reduced motion it is a still image and the full headline", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    const urls = recordRequests(page);
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator(".intro-film").scrollIntoViewIfNeeded();
    await expect(page.locator(".intro-film")).toHaveAttribute("data-state", "still");
    await expect(page.locator(".intro-film-poster")).toBeVisible();
    await expect(page.locator(".intro-film-canvas")).toBeHidden();
    for (const word of await page.locator(".intro-film-word").all()) await expect(word).toHaveCSS("opacity", "1");
    expect(urls.filter((url) => /\/media\/intro\/(lg|sm)\//.test(url))).toEqual([]);
    await context.close();
  });

  test("if the frames never arrive, the still image and headline show instead of an empty space", async ({ page }) => {
    await page.route(/\/media\/intro\/(lg|sm)\//, () => {
      // Leave every frame request hanging, like a very slow connection.
    });
    await page.goto("/");
    await page.locator(".intro-film").scrollIntoViewIfNeeded();
    await expect(page.locator(".intro-film")).toHaveAttribute("data-state", "still", { timeout: 6_000 });
    await expect(page.locator(".intro-film-poster")).toBeVisible();
    await expect(page.locator(".intro-film-word").last()).toHaveCSS("opacity", "1");
  });
});
