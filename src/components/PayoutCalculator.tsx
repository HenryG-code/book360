"use client";

// A calculator for hosts: move the sliders and see what a month of bookings pays.
// It calls the same commission function the booking flow uses, so the two can never disagree.

import { useState } from "react";
import { commissionOn } from "@/domain/pricing";

const rand = (minor: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(minor / 100);

export function PayoutCalculator() {
  const [rate, setRate] = useState(1800);
  const [nights, setNights] = useState(14);

  const earnedMinor = rate * 100 * nights;
  const commissionMinor = commissionOn(earnedMinor);

  return (
    <div className="grid gap-10 bg-white p-6 sm:p-10 lg:grid-cols-2 lg:gap-16">
      <div className="space-y-10">
        <div>
          <label htmlFor="rate" className="flex items-baseline justify-between">
            <span className="eyebrow text-stone">Your nightly rate</span>
            <span className="display text-3xl">{rand(rate * 100)}</span>
          </label>
          {/* h-11 gives the slider a tall touch area; accent-navy colours the browser's own control. */}
          <input id="rate" type="range" min={500} max={8000} step={100} value={rate} onChange={(event) => setRate(Number(event.target.value))} className="mt-3 h-11 w-full accent-navy" />
        </div>
        <div>
          <label htmlFor="nights" className="flex items-baseline justify-between">
            <span className="eyebrow text-stone">Nights booked a month</span>
            <span className="display text-3xl">{nights}</span>
          </label>
          <input id="nights" type="range" min={1} max={30} step={1} value={nights} onChange={(event) => setNights(Number(event.target.value))} className="mt-3 h-11 w-full accent-navy" />
        </div>
      </div>
      <dl aria-live="polite" className="self-center text-[0.9375rem]">
        <div className="flex justify-between gap-4 border-t border-ink/15 py-4">
          <dt className="text-stone">Guests pay for the room</dt>
          <dd>{rand(earnedMinor)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-ink/15 py-4">
          <dt className="text-stone">Book360 keeps 3%</dt>
          <dd data-testid="commission">{rand(commissionMinor)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-y border-ink/15 py-5">
          <dt className="font-medium">You keep</dt>
          <dd className="display text-4xl text-navy" data-testid="payout">{rand(earnedMinor - commissionMinor)}</dd>
        </div>
      </dl>
    </div>
  );
}
