// POST /api/bookings: the server's side of making a booking.
//
// The browser sends only what the guest chose: which stay, which dates, how many guests. It does not
// send a price. The server looks the stay up, works the price out itself and checks the dates, so a
// tampered request cannot book a room for one cent.
//
// What this does not do yet: remember the booking. It returns a reference and the confirmed price,
// and the browser keeps them. Storing bookings, and making the database refuse two bookings for the
// same night, is the job of the real backend described in docs/adr/0003.

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { repository } from "@/catalogue/repository";
import { takenNights } from "@/domain/availability";
import { formatDate } from "@/domain/dates";
import { quoteStay } from "@/domain/pricing";

const fail = (status: number, error: string) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "The request was not valid JSON.");
  }
  if (typeof body !== "object" || body === null) return fail(400, "The request was not valid.");
  const { slug, checkIn, checkOut, guests } = body as Record<string, unknown>;
  if (typeof slug !== "string" || typeof checkIn !== "string" || typeof checkOut !== "string" || typeof guests !== "number") {
    return fail(400, "The request was missing a stay, dates or guests.");
  }

  const listing = await repository.get(slug);
  if (!listing) return fail(404, "That stay does not exist.");

  const today = new Date().toISOString().slice(0, 10);
  const result = quoteStay(listing, { checkIn, checkOut, guests }, today);
  if (!result.ok) return fail(400, result.error);

  const taken = takenNights(listing.id, checkIn, checkOut);
  if (taken.length > 0) {
    // 409 Conflict: the request was well formed, but it clashes with something that already exists.
    return fail(409, `Already booked on ${taken.slice(0, 3).map(formatDate).join(", ")}${taken.length > 3 ? " and more" : ""}.`);
  }

  const reference = `B360-${randomUUID().slice(0, 8).toUpperCase()}`;
  return NextResponse.json({ reference, quote: result.quote }, { status: 201 });
}
