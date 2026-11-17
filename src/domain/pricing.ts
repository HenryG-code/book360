// Prices, and how the money is split.
//
// The business model: the guest pays the host's price, and Book360 keeps 3% of the room charge. The
// commission comes out of the host's side, so the guest never sees a surprise fee at checkout.
//
//   guest pays      = nights x nightly rate + cleaning fee
//   Book360 keeps   = 3% of (nights x nightly rate)
//   host receives   = guest pays - Book360 keeps
//
// Every amount is a whole number of cents. Decimal numbers cannot hold values like 0.1 exactly, so
// sums drift by a cent here and there; whole numbers never do.

import { isDate, nightsBetween, type DateOnly } from "./dates.ts";

/** 3% written as basis points (hundredths of a percent), so the rate itself is a whole number too. */
export const COMMISSION_BPS = 300;
export const MAX_NIGHTS = 30;

export type Rates = { nightlyRateMinor: number; cleaningFeeMinor: number; sleeps: number; currency: string };
export type StayRequest = { checkIn: DateOnly; checkOut: DateOnly; guests: number };

export type Quote = {
  nights: number;
  nightlyRateMinor: number;
  roomSubtotalMinor: number;
  cleaningFeeMinor: number;
  /** What the guest pays. */
  totalMinor: number;
  /** Book360's share: 3% of the room subtotal. */
  commissionMinor: number;
  /** What the host receives after the commission. */
  hostPayoutMinor: number;
  currency: string;
};

export type QuoteResult = { ok: true; quote: Quote } | { ok: false; error: string };

/** Commission on an amount, rounded to the nearest cent. */
export const commissionOn = (amountMinor: number): number => Math.round((amountMinor * COMMISSION_BPS) / 10_000);

/**
 * Work out the price of a stay, or say why it cannot be booked.
 *
 * The browser calls this to show a price while the guest picks dates, and the server calls it again
 * before accepting a booking. The server's answer is the one that counts: a browser can be made to
 * send any number it likes, so the server never trusts a price it did not calculate itself.
 */
export function quoteStay(rates: Rates, request: StayRequest, today?: DateOnly): QuoteResult {
  const { checkIn, checkOut, guests } = request;
  if (!isDate(checkIn) || !isDate(checkOut)) return { ok: false, error: "Choose a check-in and a check-out date." };

  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) return { ok: false, error: "Check-out must be after check-in." };
  if (nights > MAX_NIGHTS) return { ok: false, error: `A stay can be at most ${MAX_NIGHTS} nights.` };
  if (today && checkIn < today) return { ok: false, error: "Check-in cannot be in the past." };
  if (!Number.isInteger(guests) || guests < 1) return { ok: false, error: "Choose how many guests are staying." };
  if (guests > rates.sleeps) return { ok: false, error: `This stay sleeps at most ${rates.sleeps}.` };

  const roomSubtotalMinor = nights * rates.nightlyRateMinor;
  const totalMinor = roomSubtotalMinor + rates.cleaningFeeMinor;
  const commissionMinor = commissionOn(roomSubtotalMinor);
  return {
    ok: true,
    quote: {
      nights,
      nightlyRateMinor: rates.nightlyRateMinor,
      roomSubtotalMinor,
      cleaningFeeMinor: rates.cleaningFeeMinor,
      totalMinor,
      commissionMinor,
      hostPayoutMinor: totalMinor - commissionMinor,
      currency: rates.currency,
    },
  };
}
