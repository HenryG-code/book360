// Beds, and the rules that tie guests, size and price to them.
//
// The guest count of a stay is never picked on its own: it is the sum of what its beds sleep. That is
// the one rule that keeps "two beds, sleeps one" from ever happening again.
//
//   king, queen, double  2 people
//   single, daybed       1 person
//   sofa bed             2 people, and only when the stay lists one
//
// Price follows capacity through a per-guest band for each type of stay: the nightly rate divided by
// the number of guests must fall inside the band. A room for one cannot cost what a house for eight
// does, and a house for eight cannot be priced like a single room. Tests check every stay against it.

import type { Bed, BedKind, StayType } from "./types.ts";

export const BED_CAPACITY: Record<BedKind, number> = {
  king: 2,
  queen: 2,
  double: 2,
  single: 1,
  daybed: 1,
  "sofa bed": 2,
};

/** How many guests a set of beds sleeps. */
export const sleepsFor = (beds: Bed[]): number => beds.reduce((total, bed) => total + BED_CAPACITY[bed.kind] * bed.count, 0);

/** Nightly rate per guest, in rand, that each type of stay must stay within. */
export const PER_GUEST_BAND: Record<StayType, { min: number; max: number }> = {
  Room: { min: 700, max: 1500 },
  Studio: { min: 600, max: 1200 },
  House: { min: 450, max: 800 },
};

const NUMBER_WORDS = ["no", "a", "two", "three", "four", "five", "six"];

/** "a queen bed, two single beds and a sofa bed" */
export function describeBeds(beds: Bed[]): string {
  const parts = beds.map((bed) => {
    const count = NUMBER_WORDS[bed.count] ?? String(bed.count);
    return `${count} ${bed.kind} ${bed.count === 1 ? "bed" : "beds"}`.replace("sofa bed bed", "sofa bed").replace("sofa bed beds", "sofa beds").replace("daybed bed", "daybed").replace("daybed beds", "daybeds");
  });
  if (parts.length <= 1) return parts[0] ?? "no beds";
  return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}
