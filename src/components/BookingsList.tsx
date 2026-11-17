"use client";

// The guest's bookings, read from this browser's storage. Nothing here comes from the server, which is
// why the list is empty until the page has loaded in the browser.

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { stayToIcs } from "@/domain/calendar";
import { formatDate } from "@/domain/dates";
import { loadBookings, removeBooking, type Booking } from "@/lib/bookings";

const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);

/** Hands the browser a small text file to save, without any server involved. */
function downloadCalendar(booking: Booking) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const file = new Blob(
    [stayToIcs({ reference: booking.reference, name: booking.listingName, location: booking.location, checkIn: booking.checkIn, checkOut: booking.checkOut }, stamp)],
    { type: "text/calendar" },
  );
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = `${booking.reference}.ics`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function BookingsList() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [fresh, setFresh] = useState("");
  const [confirming, setConfirming] = useState("");

  useEffect(() => {
    setBookings(loadBookings());
    setFresh(new URLSearchParams(window.location.search).get("new") ?? "");
  }, []);

  if (bookings === null) return <p className="mt-10 text-sm text-stone">Loading your bookings…</p>;

  if (bookings.length === 0) {
    return (
      <div className="mt-10 bg-sand p-8 sm:p-12">
        <p className="display text-3xl">No Bookings Yet</p>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-stone">
          Bookings you make are kept in this browser. Find a stay, pick your dates and it will appear here.
        </p>
        <Link href="/stays" className="eyebrow mt-8 inline-block bg-navy px-10 py-4 text-white">
          Find a stay
        </Link>
      </div>
    );
  }

  const button = "eyebrow flex h-11 items-center border border-ink/20 px-5";

  return (
    <>
      {bookings.some((booking) => booking.reference === fresh) ? (
        <p role="status" className="mt-10 border-l-2 border-ocean bg-sand p-5 text-[0.9375rem]">
          <strong className="font-medium">Booking confirmed.</strong> Your reference is {fresh}.
        </p>
      ) : null}
      <ul className="mt-10 space-y-6">
        {bookings.map((booking) => (
          <li key={booking.reference} className="grid gap-6 border border-ink/15 bg-white p-5 sm:grid-cols-[14rem_1fr] sm:p-6">
            <div className="relative aspect-[3/2] sm:aspect-auto sm:min-h-40">
              <Image src={booking.photo} alt="" fill sizes="(min-width: 640px) 224px, 100vw" className="object-cover" />
            </div>
            <div>
              <p className="eyebrow text-stone">
                {booking.reference} · {booking.location}
              </p>
              <h2 className="display mt-2 text-3xl">
                <Link href={`/stays/${booking.listingSlug}`}>{booking.listingName}</Link>
              </h2>
              <p className="mt-3 text-[0.9375rem]">
                {formatDate(booking.checkIn)} to {formatDate(booking.checkOut)} · {booking.quote.nights}{" "}
                {booking.quote.nights === 1 ? "night" : "nights"} · {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
              </p>
              <p className="mt-1 text-[0.9375rem]">
                Total <span className="font-medium">{money(booking.quote.totalMinor, booking.quote.currency)}</span>
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" className={button} onClick={() => downloadCalendar(booking)}>
                  Add to calendar
                </button>
                {confirming === booking.reference ? (
                  <button
                    type="button"
                    className={`${button} border-red-700 text-red-800`}
                    onClick={() => {
                      removeBooking(booking.reference);
                      setBookings(loadBookings());
                      setConfirming("");
                    }}
                  >
                    Yes, cancel it
                  </button>
                ) : (
                  <button type="button" className={button} onClick={() => setConfirming(booking.reference)}>
                    Cancel booking
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
