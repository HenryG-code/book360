// Dates for stays.
//
// A stay is counted in nights, not days. A booking from the 3rd to the 5th covers the nights of the 3rd
// and the 4th; the guest leaves on the 5th, and someone else can arrive that same day. Writing the
// range as [checkIn, checkOut), "including the first, excluding the last", makes back-to-back bookings
// work without special cases.
//
// Dates are plain "YYYY-MM-DD" text with no time and no time zone. A night in a room is the same night
// wherever the guest's phone thinks it is, and a Date object with a time attached is how off-by-one-day
// bugs get in.

export type DateOnly = string;

const PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

/** Days since 1970, or NaN if the text is not a real calendar date. */
function dayNumber(date: DateOnly): number {
  if (!PATTERN.test(date)) return NaN;
  const ms = Date.parse(`${date}T00:00:00Z`);
  // Date.parse accepts "2026-02-31" and rolls it into March. Turning it back to text catches that.
  if (Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== date) return NaN;
  return ms / DAY_MS;
}

export const isDate = (value: unknown): value is DateOnly => typeof value === "string" && !Number.isNaN(dayNumber(value));

export const addDays = (date: DateOnly, days: number): DateOnly =>
  new Date((dayNumber(date) + days) * DAY_MS).toISOString().slice(0, 10);

/** Number of nights between two dates. Zero or negative means the range is not a stay. */
export const nightsBetween = (checkIn: DateOnly, checkOut: DateOnly): number => dayNumber(checkOut) - dayNumber(checkIn);

/** Every night of a stay, as the date the night begins. The check-out date is not one of them. */
export function nightsOf(checkIn: DateOnly, checkOut: DateOnly): DateOnly[] {
  const count = nightsBetween(checkIn, checkOut);
  return Array.from({ length: Math.max(0, count) }, (_, index) => addDays(checkIn, index));
}

/** True when two stays share at least one night. Leaving on the day another arrives is not an overlap. */
export const overlaps = (aIn: DateOnly, aOut: DateOnly, bIn: DateOnly, bOut: DateOnly): boolean => aIn < bOut && bIn < aOut;

export const formatDate = (date: DateOnly): string =>
  new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
