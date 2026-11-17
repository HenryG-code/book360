// Unit tests: each one calls a single function with known inputs and checks the answer.
// They need no browser and no server, so the whole file runs in well under a second.
// Run with: npm run test:unit

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isNightTaken, takenNights } from "../../src/domain/availability.ts";
import { addDays, isDate, nightsBetween, nightsOf, overlaps } from "../../src/domain/dates.ts";
import { commissionOn, quoteStay } from "../../src/domain/pricing.ts";
import { buildCatalogue } from "../../src/catalogue/generate.ts";

const rates = { nightlyRateMinor: 285_000, cleaningFeeMinor: 45_000, sleeps: 2, currency: "ZAR" };

describe("dates", () => {
  test("counts nights, not days", () => {
    assert.equal(nightsBetween("2027-03-03", "2027-03-05"), 2);
    assert.deepEqual(nightsOf("2027-03-03", "2027-03-05"), ["2027-03-03", "2027-03-04"]);
  });

  test("crosses month and year ends", () => {
    assert.equal(nightsBetween("2027-12-30", "2028-01-02"), 3);
    assert.equal(addDays("2028-02-28", 1), "2028-02-29"); // 2028 is a leap year
    assert.equal(addDays("2027-02-28", 1), "2027-03-01");
  });

  test("rejects dates that do not exist", () => {
    assert.equal(isDate("2027-02-31"), false);
    assert.equal(isDate("2027-2-3"), false);
    assert.equal(isDate("tomorrow"), false);
    assert.equal(isDate("2027-02-28"), true);
  });

  test("leaving on the day another guest arrives is not an overlap", () => {
    assert.equal(overlaps("2027-03-01", "2027-03-05", "2027-03-05", "2027-03-08"), false);
    assert.equal(overlaps("2027-03-01", "2027-03-05", "2027-03-04", "2027-03-08"), true);
  });
});

describe("pricing", () => {
  test("totals a stay and splits it between host and Book360", () => {
    const result = quoteStay(rates, { checkIn: "2027-03-03", checkOut: "2027-03-06", guests: 2 });
    assert.ok(result.ok);
    assert.equal(result.quote.nights, 3);
    assert.equal(result.quote.roomSubtotalMinor, 855_000);
    assert.equal(result.quote.totalMinor, 900_000);
    assert.equal(result.quote.commissionMinor, 25_650); // 3% of the room charge, not of the cleaning fee
    assert.equal(result.quote.hostPayoutMinor, 874_350);
  });

  test("the split always adds back up to what the guest paid", () => {
    for (let rate = 90_001; rate < 90_400; rate += 7) {
      const result = quoteStay({ ...rates, nightlyRateMinor: rate }, { checkIn: "2027-03-03", checkOut: "2027-03-10", guests: 1 });
      assert.ok(result.ok);
      assert.equal(result.quote.commissionMinor + result.quote.hostPayoutMinor, result.quote.totalMinor);
      assert.ok(Number.isInteger(result.quote.commissionMinor));
    }
  });

  test("commission rounds to the nearest cent", () => {
    assert.equal(commissionOn(100), 3);
    assert.equal(commissionOn(150), 5); // 4.5 rounds up
    assert.equal(commissionOn(0), 0);
  });

  test("refuses stays that make no sense", () => {
    const bad = (request: Parameters<typeof quoteStay>[1], today?: string) => {
      const result = quoteStay(rates, request, today);
      assert.equal(result.ok, false);
    };
    bad({ checkIn: "2027-03-05", checkOut: "2027-03-05", guests: 1 }); // zero nights
    bad({ checkIn: "2027-03-05", checkOut: "2027-03-03", guests: 1 }); // backwards
    bad({ checkIn: "2027-03-05", checkOut: "2027-05-05", guests: 1 }); // too long
    bad({ checkIn: "2027-03-05", checkOut: "2027-03-07", guests: 3 }); // too many guests
    bad({ checkIn: "2027-03-05", checkOut: "2027-03-07", guests: 0 });
    bad({ checkIn: "nonsense", checkOut: "2027-03-07", guests: 1 });
    bad({ checkIn: "2027-03-05", checkOut: "2027-03-07", guests: 1 }, "2027-03-06"); // already past
  });
});

describe("availability", () => {
  test("gives the same answer every time for the same stay and night", () => {
    assert.equal(isNightTaken(42, "2027-03-03"), isNightTaken(42, "2027-03-03"));
  });

  test("takes roughly a quarter of nights, not none and not all", () => {
    let taken = 0;
    for (let id = 1; id <= 400; id++) if (isNightTaken(id, "2027-06-15")) taken++;
    assert.ok(taken > 50 && taken < 150, `${taken} of 400 taken`);
  });

  test("lists only nights inside the requested stay", () => {
    for (const night of takenNights(7, "2027-03-01", "2027-03-29")) {
      assert.ok(night >= "2027-03-01" && night < "2027-03-29");
    }
  });
});

describe("catalogue", () => {
  const catalogue = buildCatalogue(5_000);

  test("builds the size asked for, with unique addresses", () => {
    assert.equal(catalogue.length, 5_000);
    assert.equal(new Set(catalogue.map((listing) => listing.slug)).size, 5_000);
  });

  test("is the same on every run", () => {
    const again = buildCatalogue(5_000);
    assert.equal(again[1803]!.slug, catalogue[1803]!.slug);
    assert.equal(again[1803]!.nightlyRateMinor, catalogue[1803]!.nightlyRateMinor);
  });

  test("keeps the three hand-written stays first, with their short addresses", () => {
    assert.deepEqual(catalogue.slice(0, 3).map((listing) => listing.slug), ["cliffside-suite", "glass-house", "city-room"]);
  });

  test("every stay has whole-cent prices and at least one guest", () => {
    for (const listing of catalogue) {
      assert.ok(Number.isInteger(listing.nightlyRateMinor) && listing.nightlyRateMinor > 0);
      assert.ok(Number.isInteger(listing.cleaningFeeMinor) && listing.cleaningFeeMinor >= 0);
      assert.ok(listing.sleeps >= 1);
    }
  });
});

describe("calendar file", () => {
  test("is an all-day event that ends on the check-out day", async () => {
    const { stayToIcs } = await import("../../src/domain/calendar.ts");
    const ics = stayToIcs(
      { reference: "B360-TEST0001", name: "Cliffside Suite", location: "Whale Coast", checkIn: "2027-03-03", checkOut: "2027-03-06" },
      "20270301T120000Z",
    );
    assert.match(ics, /DTSTART;VALUE=DATE:20270303\r\n/);
    assert.match(ics, /DTEND;VALUE=DATE:20270306\r\n/);
    assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n"));
  });

  test("escapes punctuation that has special meaning in the format", async () => {
    const { stayToIcs } = await import("../../src/domain/calendar.ts");
    const ics = stayToIcs({ reference: "R", name: "Sea; Sky, Sand", location: "X", checkIn: "2027-03-03", checkOut: "2027-03-04" }, "S");
    assert.match(ics, /SUMMARY:Stay at Sea\\; Sky\\, Sand/);
  });
});

describe("search address", () => {
  test("keeps what is valid and drops what is not", async () => {
    const { parseSearch } = await import("../../src/catalogue/query.ts");
    assert.deepEqual(parseSearch({ region: "Whale Coast", type: "House", guests: "4", max: "2500", sort: "price-asc", page: "3" }), {
      text: undefined, region: "Whale Coast", type: "House", guests: 4, maxRateMinor: 250_000, sort: "price-asc", page: 3,
    });
    const junk = parseSearch({ region: "Nowhere", type: "Castle", guests: "abc", max: "-5", sort: "random", page: "0" });
    assert.deepEqual(Object.values(junk).filter((value) => value !== undefined), []);
  });

  test("turns a search back into the same address", async () => {
    const { parseSearch, searchHref } = await import("../../src/catalogue/query.ts");
    const href = "/stays?region=Whale+Coast&type=House&guests=4&page=2";
    const params = Object.fromEntries(new URL("http://x" + href).searchParams);
    assert.equal(searchHref(parseSearch(params)), href);
    assert.equal(searchHref({}), "/stays");
  });
});
