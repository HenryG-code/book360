import { expect, test } from "@playwright/test";
import { takenNights } from "../../src/domain/availability.ts";
import { addDays } from "../../src/domain/dates.ts";

// The booking flow when things go wrong: requests a visitor could forge, a past date typed into the
// form, a browser that blocks storage, and a visitor who only uses the keyboard.

const day = (offset: number) => addDays(new Date().toISOString().slice(0, 10), offset);

/** A run of free nights for the City Room (catalogue stay 3), starting some way ahead. */
function freeNights(nights: number, from = 60) {
  let checkIn = day(from);
  while (takenNights(3, checkIn, addDays(checkIn, nights)).length > 0) checkIn = addDays(checkIn, 1);
  return { checkIn, checkOut: addDays(checkIn, nights) };
}

test.describe("the booking server refuses bad requests", () => {
  const cases: [string, Record<string, unknown>, number][] = [
    ["a check-in in the past", { slug: "city-room", checkIn: day(-3), checkOut: day(-1), guests: 1 }, 400],
    ["more than 30 nights", { slug: "city-room", checkIn: day(40), checkOut: day(71), guests: 1 }, 400],
    ["more guests than beds", { slug: "city-room", checkIn: day(40), checkOut: day(42), guests: 3 }, 400],
    ["zero guests", { slug: "city-room", checkIn: day(40), checkOut: day(42), guests: 0 }, 400],
    ["half a guest", { slug: "city-room", checkIn: day(40), checkOut: day(42), guests: 1.5 }, 400],
    ["a date that does not exist", { slug: "city-room", checkIn: "2027-02-30", checkOut: "2027-03-02", guests: 1 }, 400],
    ["missing dates", { slug: "city-room" }, 400],
    ["a stay that does not exist", { slug: "nope", checkIn: day(40), checkOut: day(42), guests: 1 }, 404],
    ["script in the stay name", { slug: "<script>alert(1)</script>", checkIn: day(40), checkOut: day(42), guests: 1 }, 404],
  ];
  for (const [name, data, status] of cases) {
    test(name, async ({ request }) => {
      const response = await request.post("/api/bookings", { data });
      expect(response.status()).toBe(status);
      expect((await response.json()).error).toBeTruthy();
    });
  }

  test("a body that is not JSON", async ({ request }) => {
    const response = await request.post("/api/bookings", { data: "not json", headers: { "Content-Type": "application/json" } });
    expect(response.status()).toBe(400);
  });

  test("reading bookings is not allowed", async ({ request }) => {
    expect((await request.get("/api/bookings")).status()).toBe(405);
  });
});

test("the form refuses a check-in in the past", async ({ page }) => {
  await page.goto("/stays/city-room/book");
  await page.getByLabel("Check-in").fill(day(-2));
  await page.getByLabel("Check-out").fill(day(1));
  await expect(page.getByText("Check-in cannot be in the past.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm demo booking" })).toBeDisabled();
});

test("with storage blocked, pages still work and a booking says it could not be saved", async ({ browser }) => {
  const context = await browser.newContext();
  // Private windows and strict privacy settings can make localStorage throw on any access.
  await context.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage is blocked", "SecurityError");
      },
    });
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/bookings");
  await expect(page.getByText("No Bookings Yet")).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const { checkIn, checkOut } = freeNights(1);
  await page.goto("/stays/city-room/book");
  await page.getByLabel("Check-in").fill(checkIn);
  await page.getByLabel("Check-out").fill(checkOut);
  await page.getByRole("button", { name: "Confirm demo booking" }).click();
  await expect(page.getByText(/^Booked as B360-[0-9A-F]{8}, but this browser would not save it/)).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
});

test("a visitor can book using only the keyboard", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard use is tested at desktop size");
  const { checkIn, checkOut } = freeNights(2, 120);
  await page.goto("/stays/city-room/book");
  // Date pickers look different in every browser and language, so the dates are set directly; what
  // this test proves is that the rest of the form works from the keyboard.
  await page.getByLabel("Check-in").fill(checkIn);
  await page.getByLabel("Check-out").fill(checkOut);
  await page.getByLabel("Guests").focus();
  // From the guests list, Tab must reach Confirm without a mouse, and Enter must book.
  for (let presses = 0; presses < 6; presses++) {
    if (await page.getByRole("button", { name: "Confirm demo booking" }).evaluate((el) => el === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(page.getByRole("button", { name: "Confirm demo booking" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/bookings\?new=B360-/);
});
