"use client";

// The booking form. It runs in the browser because it reacts to every change the guest makes.
//
// It uses the same pricing function as the server (src/domain/pricing.ts), so the price shown while
// choosing dates is worked out exactly the way the server will work it out. On submit the server
// repeats the calculation and its answer is the one that is saved.

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { takenNights } from "@/domain/availability";
import { addDays, formatDate, overlaps } from "@/domain/dates";
import { quoteStay, type Quote } from "@/domain/pricing";
import { loadBookings, saveBooking, type Booking } from "@/lib/bookings";

export type BookableStay = {
  id: number;
  slug: string;
  name: string;
  location: string;
  photo: string;
  nightlyRateMinor: number;
  cleaningFeeMinor: number;
  sleeps: number;
  currency: string;
};

const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);

const field = "h-12 w-full border border-ink/20 bg-white px-3 text-[0.9375rem] text-ink";
const label = "eyebrow mb-2 block text-stone";

export function BookingForm({ stay }: { stay: BookableStay }) {
  const router = useRouter();
  // "Today" is only known in the browser, so it is filled in after the page loads. Until then the
  // server and the browser render the same thing, which React requires.
  const [today, setToday] = useState("");
  const [mine, setMine] = useState<Booking[]>([]);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(Math.min(2, stay.sleeps));
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
    setMine(loadBookings().filter((booking) => booking.listingId === stay.id));
  }, [stay.id]);

  const state = useMemo((): { quote?: Quote; problem?: string } => {
    if (!checkIn || !checkOut) return {};
    const result = quoteStay(stay, { checkIn, checkOut, guests }, today || undefined);
    if (!result.ok) return { problem: result.error };
    const taken = takenNights(stay.id, checkIn, checkOut);
    if (taken.length > 0) {
      return { problem: `Already booked on ${taken.slice(0, 3).map(formatDate).join(", ")}${taken.length > 3 ? " and more" : ""}. Try other dates.` };
    }
    if (mine.some((booking) => overlaps(checkIn, checkOut, booking.checkIn, booking.checkOut))) {
      return { problem: "You already have a booking here that overlaps these dates." };
    }
    return { quote: result.quote };
  }, [stay, checkIn, checkOut, guests, today, mine]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!state.quote || sending) return;
    setSending(true);
    setServerError("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: stay.slug, checkIn, checkOut, guests }),
      });
      const data = (await response.json()) as { reference?: string; quote?: Quote; error?: string };
      if (!response.ok || !data.reference || !data.quote) {
        setServerError(data.error ?? "The booking could not be made. Please try again.");
        return;
      }
      const saved = saveBooking({
        reference: data.reference,
        listingId: stay.id,
        listingSlug: stay.slug,
        listingName: stay.name,
        location: stay.location,
        photo: stay.photo,
        checkIn,
        checkOut,
        guests,
        quote: data.quote, // the server's figures, not the browser's
        createdAt: new Date().toISOString(),
      });
      if (!saved) {
        setServerError(`Booked as ${data.reference}, but this browser would not save it. Note the reference down.`);
        return;
      }
      router.push(`/bookings?new=${data.reference}`);
    } catch {
      setServerError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  const { quote, problem } = state;

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="check-in" className={label}>Check-in</label>
          <input
            id="check-in"
            type="date"
            required
            min={today || undefined}
            value={checkIn}
            onChange={(event) => {
              const value = event.target.value;
              setCheckIn(value);
              // Picking a check-in on or after the check-out moves the check-out to the next day.
              if (value && (!checkOut || checkOut <= value)) setCheckOut(addDays(value, 1));
            }}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="check-out" className={label}>Check-out</label>
          <input
            id="check-out"
            type="date"
            required
            min={checkIn ? addDays(checkIn, 1) : today || undefined}
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
            className={field}
          />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="guests" className={label}>Guests</label>
        <select id="guests" value={guests} onChange={(event) => setGuests(Number(event.target.value))} className={field}>
          {Array.from({ length: stay.sleeps }, (_, index) => index + 1).map((count) => (
            <option key={count} value={count}>
              {count} {count === 1 ? "guest" : "guests"}
            </option>
          ))}
        </select>
      </div>

      {/* aria-live makes a screen reader announce the price or the problem when it changes. */}
      <div aria-live="polite" className="mt-8 min-h-40">
        {problem ? <p className="border-l border-red-700 pl-4 text-sm text-red-800">{problem}</p> : null}
        {quote ? (
          <>
            <dl className="text-[0.9375rem]">
              <div className="flex justify-between gap-4 border-t border-ink/15 py-3.5">
                <dt className="text-stone">
                  {money(quote.nightlyRateMinor, quote.currency)} × {quote.nights} {quote.nights === 1 ? "night" : "nights"}
                </dt>
                <dd>{money(quote.roomSubtotalMinor, quote.currency)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-ink/15 py-3.5">
                <dt className="text-stone">Cleaning fee</dt>
                <dd>{money(quote.cleaningFeeMinor, quote.currency)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-y border-ink/15 py-4">
                <dt className="font-medium">Total</dt>
                <dd className="display text-3xl" data-testid="total">{money(quote.totalMinor, quote.currency)}</dd>
              </div>
            </dl>
            <details className="group mt-3 text-sm">
              <summary className="flex h-11 cursor-pointer items-center justify-between text-stone">
                Where the money goes
                <span aria-hidden="true" className="text-lg transition-transform group-open:rotate-45">+</span>
              </summary>
              <dl className="space-y-2 pb-2 text-stone">
                <div className="flex justify-between gap-4">
                  <dt>Your host receives</dt>
                  <dd className="text-ink">{money(quote.hostPayoutMinor, quote.currency)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Book360 keeps 3% of the room charge</dt>
                  <dd className="text-ink">{money(quote.commissionMinor, quote.currency)}</dd>
                </div>
              </dl>
            </details>
          </>
        ) : null}
        {!quote && !problem ? <p className="text-sm text-stone">Choose your dates to see the price.</p> : null}
      </div>

      {serverError ? <p role="alert" className="mb-4 border-l border-red-700 pl-4 text-sm text-red-800">{serverError}</p> : null}

      <button
        type="submit"
        disabled={!quote || sending}
        className="eyebrow h-14 w-full bg-navy text-white transition-colors hover:bg-navy-deep disabled:cursor-not-allowed disabled:bg-sand-deep disabled:text-stone"
      >
        {sending ? "Confirming…" : "Confirm demo booking"}
      </button>
      <p className="mt-4 text-xs leading-relaxed text-stone">
        A demo. No payment is taken and no real room is held. The booking is saved in this browser only.
      </p>
    </form>
  );
}
