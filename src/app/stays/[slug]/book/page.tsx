import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { findListing, formatMoney, listings } from "@/data/listings";

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = () => listings.map(({ slug }) => ({ slug }));
export const dynamicParams = false;
export const metadata: Metadata = { title: "Reserve" };

// A placeholder for the booking flow that slice 6 builds. It exists now only to prove one thing:
// a visitor can get from a stay to booking without the 360 viewer ever loading.
export default async function BookPage({ params }: Props) {
  const listing = findListing((await params).slug);
  if (!listing) notFound();

  const rows = [
    { label: "Stay", value: listing.name },
    { label: "Location", value: listing.location },
    { label: "Sleeps", value: `${listing.sleeps} guests` },
    { label: "Nightly rate", value: formatMoney(listing.nightlyRateMinor, listing.currency) },
  ];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-12 lg:items-center lg:px-10 lg:py-24">
        <div className="relative aspect-[4/3] lg:col-span-6 lg:aspect-[4/5]">
          <Image
            src={listing.photos[0].src}
            alt={listing.photos[0].alt}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <p className="eyebrow text-stone">Demo booking</p>
          <h1 className="display mt-6 text-5xl sm:text-6xl">Reserve {listing.name}</h1>
          <dl className="mt-12 border-b border-ink/15 text-[0.9375rem]">
            {rows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-6 border-t border-ink/15 py-5">
                <dt className="eyebrow text-stone">{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 border-l border-navy pl-5 text-sm leading-relaxed text-stone">
            This is a prototype. Dates, fees and confirmation are not built yet, and nothing on this page reserves a
            room or takes a payment.
          </p>
          <Link href={`/stays/${listing.slug}`} className="text-link mt-10">
            Back to {listing.name}
          </Link>
        </div>
      </main>
    </>
  );
}
