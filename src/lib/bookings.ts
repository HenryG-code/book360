// Where confirmed bookings are kept: in this browser's own storage.
//
// There is no account system and no shared database yet, so a booking made here is visible only in
// the browser that made it. That is the honest limit of "semi-working": the whole flow runs, the server
// checks the price and the dates, but nothing is held for you against another guest.
//
// Browser storage can be switched off, full or blocked (private windows often do this), so every read
// and write is wrapped. A failure means "no saved bookings", never a broken page.

import type { DateOnly } from "@/domain/dates";
import type { Quote } from "@/domain/pricing";

export type Booking = {
  reference: string;
  listingId: number;
  listingSlug: string;
  listingName: string;
  location: string;
  photo: string;
  checkIn: DateOnly;
  checkOut: DateOnly;
  guests: number;
  quote: Quote;
  createdAt: string;
};

const KEY = "book360.bookings.v1";

export function loadBookings(): Booking[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as Booking[]) : [];
  } catch {
    return [];
  }
}

/** Returns false when the browser would not store it, so the page can say so instead of pretending. */
function store(bookings: Booking[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(bookings));
    return true;
  } catch {
    return false;
  }
}

export const saveBooking = (booking: Booking): boolean => store([booking, ...loadBookings()]);

export const removeBooking = (reference: string): boolean =>
  store(loadBookings().filter((booking) => booking.reference !== reference));
