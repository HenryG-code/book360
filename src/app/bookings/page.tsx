import type { Metadata } from "next";
import { BookingsList } from "@/components/BookingsList";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "My bookings" };

export default function BookingsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 pb-28 pt-12 lg:pt-20">
        <p className="eyebrow text-stone">Saved in this browser</p>
        <h1 className="display mt-5 text-5xl sm:text-7xl">My Bookings</h1>
        <BookingsList />
        <p className="mt-12 border-l border-navy pl-5 text-sm leading-relaxed text-stone">
          <strong className="font-medium text-ink">Demo bookings.</strong> These are stored only in this browser. No
          room is held, no payment is taken, and they will not appear on another device.
        </p>
      </main>
    </>
  );
}
