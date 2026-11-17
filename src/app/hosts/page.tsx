import type { Metadata } from "next";
import Link from "next/link";
import { PayoutCalculator } from "@/components/PayoutCalculator";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "For hosts" };

const points = [
  { title: "One Number", text: "We keep 3% of the room charge on each booking. Nothing to list, nothing monthly, nothing when a room sits empty." },
  { title: "Guests See Your Price", text: "The commission comes out of the host's side. A guest pays the nightly rate and the cleaning fee, with no service fee added at checkout." },
  { title: "Your Cleaning Fee Stays Yours", text: "The 3% is worked out on the room charge only. The cleaning fee passes straight through to you." },
];

// The business model, stated plainly, with a calculator a host can play with.
export default function HostsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-7xl px-6 pb-16 pt-12 lg:px-10 lg:pb-24 lg:pt-20">
          <p className="eyebrow text-stone">For hosts</p>
          <h1 className="display rise mt-5 max-w-4xl text-5xl sm:text-7xl lg:text-8xl">Keep 97% of Every Booking</h1>
          <p className="mt-8 max-w-xl text-[0.9375rem] leading-relaxed text-stone">
            Book360 earns money one way: a 3% commission on the room charge of each booking. If nobody
            books, you pay nothing.
          </p>
        </section>

        <section aria-labelledby="calculator-heading" className="bg-sand px-6 py-20 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-5xl">
            <h2 id="calculator-heading" className="display reveal text-4xl sm:text-5xl">What a Month Could Pay</h2>
            <div className="reveal mt-10">
              <PayoutCalculator />
            </div>
            <p className="mt-6 text-xs leading-relaxed text-stone">
              An illustration, not a promise of earnings. It leaves out cleaning fees, tax and card processing
              charges, which a real payment provider would deduct.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
          <ul className="grid gap-10 md:grid-cols-3">
            {points.map((point, index) => (
              <li key={point.title} className="reveal border-t border-ink/15 pt-6">
                <p aria-hidden="true" className="display text-4xl text-sand-deep">0{index + 1}</p>
                <h2 className="display mt-4 text-2xl">{point.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-stone">{point.text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-16 border-l border-navy pl-5 text-sm leading-relaxed text-stone">
            <strong className="font-medium text-ink">A demo.</strong> Hosts cannot sign up yet, and no money moves.
            This page describes how the model is meant to work.{" "}
            <Link href="/stays" className="underline">See the stays</Link>
          </p>
        </section>
      </main>
    </>
  );
}
