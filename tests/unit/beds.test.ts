// The rules that keep guests, beds, size and price in agreement across the whole catalogue.
// If a change to the generator breaks any of them, these fail before the change can reach the site.

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { BED_CAPACITY, describeBeds, PER_GUEST_BAND, sleepsFor } from "../../src/catalogue/beds.ts";
import { buildCatalogue } from "../../src/catalogue/generate.ts";
import { roomByKey } from "../../src/catalogue/rooms.ts";
import type { Listing, StayType } from "../../src/catalogue/types.ts";
import { quoteStay } from "../../src/domain/pricing.ts";

// The rules must hold for the catalogue the site shows, and for the large test catalogue used to
// check scale, so both are checked.
const catalogue = [...buildCatalogue(), ...buildCatalogue(2_400).slice(buildCatalogue().length)];
const TYPES: StayType[] = ["Room", "Studio", "House"];

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
};

describe("bed capacity", () => {
  test("doubles and bigger sleep two, singles and daybeds one, a sofa bed two", () => {
    assert.deepEqual(BED_CAPACITY, { king: 2, queen: 2, double: 2, single: 1, daybed: 1, "sofa bed": 2 });
    assert.equal(sleepsFor([{ kind: "single", count: 2 }]), 2);
    assert.equal(sleepsFor([{ kind: "queen", count: 1 }, { kind: "single", count: 2 }, { kind: "sofa bed", count: 1 }]), 6);
  });

  test("reads naturally", () => {
    assert.equal(describeBeds([{ kind: "single", count: 2 }]), "two single beds");
    assert.equal(describeBeds([{ kind: "double", count: 1 }, { kind: "daybed", count: 1 }]), "a double bed and a daybed");
    assert.equal(describeBeds([{ kind: "king", count: 1 }, { kind: "single", count: 2 }, { kind: "sofa bed", count: 1 }]), "a king bed, two single beds and a sofa bed");
  });
});

describe("the catalogue the site shows", () => {
  test("gives every stay its own photograph", () => {
    const shown = buildCatalogue();
    const photos = shown.map((listing) => listing.photos[0].src);
    assert.equal(new Set(photos).size, shown.length);
    assert.equal(new Set(shown.map((listing) => listing.roomKey)).size, shown.length);
  });

  test("uses every photographed room exactly once", () => {
    assert.equal(buildCatalogue().length, roomByKey.size);
  });
});

describe("every stay in the catalogue", () => {
  test("sleeps exactly as many guests as its beds hold", () => {
    const wrong = catalogue.filter((listing) => listing.beds.length === 0 || listing.sleeps !== sleepsFor(listing.beds));
    assert.deepEqual(wrong.map((listing) => listing.slug), []);
  });

  test("a room or studio has exactly the beds its photograph shows", () => {
    for (const listing of catalogue.filter((item) => item.type !== "House")) {
      assert.deepEqual(listing.beds, roomByKey.get(listing.roomKey)!.beds, listing.slug);
      assert.equal(listing.bedrooms, listing.type === "Room" ? 1 : 0, listing.slug);
    }
  });

  test("a house has two to four bedrooms, each sleeping two, plus a sofa bed only if one is listed", () => {
    for (const listing of catalogue.filter((item) => item.type === "House")) {
      assert.ok(listing.bedrooms >= 2 && listing.bedrooms <= 4, listing.slug);
      const sofa = listing.beds.find((bed) => bed.kind === "sofa bed")?.count ?? 0;
      assert.equal(listing.sleeps, listing.bedrooms * 2 + sofa * 2, listing.slug);
    }
  });

  test("never uses a photograph without a bed as a room or studio", () => {
    for (const listing of catalogue.filter((item) => item.type !== "House")) {
      assert.ok(roomByKey.get(listing.roomKey)!.beds.length > 0, listing.slug);
    }
  });

  test("costs between its type's limits per guest per night", () => {
    // The rule: nightly rate / guests must sit inside the band for the type of stay.
    //   Room R700-R1,500   Studio R600-R1,200   House R450-R800
    const outside = catalogue.filter((listing) => {
      const perGuest = listing.nightlyRateMinor / 100 / listing.sleeps;
      const band = PER_GUEST_BAND[listing.type];
      return perGuest < band.min || perGuest > band.max;
    });
    assert.deepEqual(outside.map((listing) => `${listing.slug}: R${listing.nightlyRateMinor / 100} for ${listing.sleeps}`), []);
  });

  test("of a type, costs more in the middle as capacity grows", () => {
    for (const type of TYPES) {
      const bySleeps = new Map<number, number[]>();
      for (const listing of catalogue.filter((item) => item.type === type)) {
        bySleeps.set(listing.sleeps, [...(bySleeps.get(listing.sleeps) ?? []), listing.nightlyRateMinor]);
      }
      const capacities = [...bySleeps.keys()].sort((a, b) => a - b);
      for (let i = 1; i < capacities.length; i++) {
        const smaller = median(bySleeps.get(capacities[i - 1]!)!);
        const bigger = median(bySleeps.get(capacities[i]!)!);
        assert.ok(bigger > smaller, `${type}: sleeps ${capacities[i]} median R${bigger / 100} is not above sleeps ${capacities[i - 1]} median R${smaller / 100}`);
      }
    }
  });

  test("can be booked for its full capacity and not one guest more", () => {
    const stay = (listing: Listing, guests: number) => quoteStay(listing, { checkIn: "2027-03-03", checkOut: "2027-03-05", guests });
    for (const listing of catalogue.filter((_, index) => index % 50 === 0)) {
      assert.equal(stay(listing, listing.sleeps).ok, true, listing.slug);
      assert.equal(stay(listing, listing.sleeps + 1).ok, false, listing.slug);
    }
  });
});
