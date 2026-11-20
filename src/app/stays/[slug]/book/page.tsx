import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/BookingForm";
import { SiteHeader } from "@/components/SiteHeader";
import { repository } from "@/catalogue/repository";
import { findListing } from "@/data/listings";

type Props = { params: Promise<{ slug: string }> };

// Built ahead of time for the hand-written stays, and on first request for the rest (see the stay page).
export const generateStaticParams = async () => (await repository.featured()).map(({ slug }) => ({ slug }));
export const dynamicParams = true;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await findListing((await params).slug);
  return { title: listing ? `Reserve ${listing.name}` : "Stay not found" };
}

// The page itself is still plain server-rendered HTML. Only the form is a client component, and it is
// handed just the few facts it needs, so the browser never downloads the catalogue.
// The 360 viewer is not part of this page at all: booking never depends on it.
export default async function BookPage({ params }: Props) {
  const listing = await findListing((await params).slug);
  if (!listing) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-12 lg:gap-12 lg:px-10 lg:py-20">
        <div className="lg:col-span-6">
          <div className="relative aspect-[3/2] lg:aspect-[4/5]">
            <Image
              src={listing.photos[0].src}
              alt={listing.photos[0].alt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <p className="eyebrow text-stone">
            {listing.type} · {listing.location} · sleeps {listing.sleeps}
          </p>
          <h1 className="display mt-5 text-4xl sm:text-6xl">Reserve {listing.name}</h1>
          <div className="mt-10">
            <BookingForm
              stay={{
                id: listing.id,
                slug: listing.slug,
                name: listing.name,
                location: listing.location,
                photo: listing.photos[0].src,
                nightlyRateMinor: listing.nightlyRateMinor,
                cleaningFeeMinor: listing.cleaningFeeMinor,
                sleeps: listing.sleeps,
                currency: listing.currency,
              }}
            />
          </div>
          <Link href={`/stays/${listing.slug}`} className="text-link mt-6">
            Back to {listing.name}
          </Link>
        </div>
      </main>
    </>
  );
}
