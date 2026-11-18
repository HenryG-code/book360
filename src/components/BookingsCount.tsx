"use client";

// A small number beside "My bookings" once the visitor has made a booking, so they can find it again.
// Bookings live in this browser's storage, so the count can only be read in the browser: it appears
// after the page loads, and stays hidden when there are none or storage is blocked.

import { useEffect, useState } from "react";
import { loadBookings } from "@/lib/bookings";

export function BookingsCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const read = () => setCount(loadBookings().length);
    read();
    // Another tab may book or cancel; the browser announces storage changes made elsewhere.
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);

  if (count === 0) return null;
  return (
    <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-ocean px-1.5 text-[0.625rem] font-semibold leading-5 text-white">
      {count}
      <span className="sr-only">{count === 1 ? " booking" : " bookings"}</span>
    </span>
  );
}
