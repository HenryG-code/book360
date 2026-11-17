// Which nights are already taken.
//
// There is no shared database yet, so nobody else's real bookings exist. To make the calendar behave
// like a real one, each stay has a made-up pattern of taken nights, worked out from the stay's number
// and the date. The same stay always has the same taken nights, on the server and in the browser.
//
// A real system replaces takenNights with a database query and, more importantly, makes the database
// itself refuse two bookings for the same night (see docs/adr/0003). Checking in code alone is not
// enough: two guests can check at the same moment and both be told the night is free.

import { nightsOf, type DateOnly } from "./dates.ts";

/** A stable pseudo-random number from 0 to 99 for one stay and one week. */
function weekScore(listingId: number, date: DateOnly): number {
  const week = Math.floor(Date.parse(`${date}T00:00:00Z`) / (7 * 86_400_000));
  // Mix the two numbers thoroughly, so neighbouring stays and weeks get unrelated answers.
  let hash = (Math.imul(listingId, 73856093) ^ Math.imul(week, 19349663)) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35) >>> 0;
  return ((hash ^ (hash >>> 16)) >>> 0) % 100;
}

/** True when the simulated calendar says someone else has this night. About one week in four is taken. */
export const isNightTaken = (listingId: number, night: DateOnly): boolean => weekScore(listingId, night) < 25;

/** The nights of a requested stay that are already taken. An empty list means the stay is free. */
export const takenNights = (listingId: number, checkIn: DateOnly, checkOut: DateOnly): DateOnly[] =>
  nightsOf(checkIn, checkOut).filter((night) => isNightTaken(listingId, night));
