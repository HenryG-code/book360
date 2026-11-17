import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RoomTour } from "@/components/RoomTour";
import { SiteHeader } from "@/components/SiteHeader";
import { StayCard } from "@/components/StayCard";
import { repository } from "@/catalogue/repository";
import { describeBeds } from "@/catalogue/beds";
import { assetPage, findListing, formatMoney } from "@/data/listings";

type Props = { params: Promise<{ slug: string }> };

// Tells Next.js the full list of stays at build time, so each page is plain pre-built HTML.
//
// With thousands of stays, building every page up front would make each deploy slower as the
// catalogue grows. So only the hand-written stays are built ahead of time. Any other stay is built the
// first time someone asks for it, then kept and served as a ready-made page from then on.
export const generateStaticParams = async () => (await repository.featured()).map(({ slug }) => ({ slug }));
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await findListing((await params).slug);
  return { title: listing?.name ?? "Stay not found" };
}

export default async function StayPage({ params }: Props) {
  const listing = await findListing((await params).slug);
  if (!listing) notFound();

  const price = formatMoney(listing.nightlyRateMinor, listing.currency);
  const others = await repository.related(listing, 3);
  const source = (
    <a href={assetPage(listing.credit)} className="underline" rel="noreferrer">
      Source: Poly Haven, {listing.credit.licence}
    </a>
  );
  // Guests always come from the beds, so the two can be shown side by side and never disagree.
  const beds = describeBeds(listing.beds);
  const facts = [
    { label: "Sleeps", value: `${listing.sleeps} ${listing.sleeps === 1 ? "guest" : "guests"}` },
    { label: "Beds", value: beds.charAt(0).toUpperCase() + beds.slice(1) },
    { label: "Bedrooms", value: listing.bedrooms === 0 ? "Open-plan studio" : String(listing.bedrooms) },
    { label: "Where", value: listing.location },
    {
      label: "Tour",
      value: listing.type === "House" ? "The living room in 360°. Bedrooms are not photographed" : "The whole room in 360°",
    },
    { label: "Photos", value: "Cut from the same photograph" },
  ];

  return (
    <>
      <SiteHeader />
      <main className="flex flex-col">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <nav aria-label="Breadcrumb" className="eyebrow pt-10 text-stone">
            <Link href="/#stays" className="-my-4 inline-block py-4 hover:text-ink">
              Stays
            </Link>
            <span aria-hidden="true" className="mx-3">
              /
            </span>
            <span aria-current="page" className="text-ink">
              {listing.name}
            </span>
          </nav>

          <div className="grid gap-10 pb-14 pt-10 lg:grid-cols-12 lg:items-end lg:pb-20 lg:pt-16">
            <div className="lg:col-span-8">
              <p className="eyebrow text-stone">
                {listing.kicker} · {listing.location}
              </p>
              <h1 className="display rise mt-6 text-[clamp(3.25rem,9vw,8rem)]">{listing.name}</h1>
            </div>
            {/* The booking link sits above the tour on purpose: booking never waits for the viewer. */}
            <div className="lg:col-span-4 lg:pb-3">
              <p className="max-w-sm text-[0.9375rem] leading-relaxed text-stone">{listing.summary}</p>
              <div className="mt-7 hidden items-center gap-6 sm:flex">
                <Link
                  href={`/stays/${listing.slug}/book`}
                  className="eyebrow bg-navy px-9 py-4 text-white transition-colors hover:bg-navy-deep"
                >
                  Reserve
                </Link>
                <p className="text-sm text-stone">
                  <span className="display text-2xl text-ink">{price}</span> a night
                </p>
              </div>
            </div>
          </div>

          <section aria-labelledby="tour-heading">
            <h2 id="tour-heading" className="sr-only">
              360° room tour
            </h2>
            <RoomTour
              tour={listing.tour}
              poster={listing.photos[0]}
              name={listing.name}
              about={
                <>
                  A real 360° photograph by {listing.credit.author}, resized for the web. Nothing in it is
                  generated. The stay around it is invented. {source}
                </>
              }
            />
          </section>

          <section aria-label="About this stay" className="grid gap-12 py-24 lg:grid-cols-12 lg:py-32">
            <div className="lg:col-span-7">
              <p className="eyebrow text-stone">The room</p>
              <h2 className="display mt-6 max-w-xl text-4xl sm:text-5xl">{listing.tagline}</h2>
              <dl className="mt-12 grid gap-x-10 sm:grid-cols-2">
                {facts.map((fact) => (
                  <div key={fact.label} className="border-t border-ink/15 py-5">
                    <dt className="eyebrow text-stone">{fact.label}</dt>
                    <dd className="mt-2 text-[0.9375rem]">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <aside aria-label="Reserve" className="on-dark self-start bg-navy p-10 text-white lg:col-span-4 lg:col-start-9">
              <p className="eyebrow text-white/60">From</p>
              <p className="display mt-4 text-5xl">{price}</p>
              <p className="mt-2 text-sm text-white/70">a night · sleeps {listing.sleeps}</p>
              <Link
                href={`/stays/${listing.slug}/book`}
                className="eyebrow mt-9 block bg-white px-8 py-4 text-center text-ink transition-opacity hover:opacity-85"
              >
                Reserve this stay
              </Link>
              <p className="mt-5 text-xs leading-relaxed text-white/55">
                A demo booking. Nothing is reserved and nothing is charged.
              </p>
            </aside>
          </section>
        </div>

        <section id="photos" aria-labelledby="photos-heading" className="scroll-mt-8 bg-sand py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-6">
                <p className="eyebrow text-stone">Gallery</p>
                <h2 id="photos-heading" className="display mt-6 text-5xl sm:text-6xl">
                  Photos
                </h2>
              </div>
              <p className="border-l border-navy pl-5 text-sm leading-relaxed text-stone lg:col-span-5 lg:col-start-8">
                <strong className="font-medium text-ink">Real photographs, invented stay.</strong> These pictures are
                cut from the same 360° photograph as the tour, so they show the same room. The stay&apos;s name,
                place and price are made up for this demo
                {listing.featured ? "" : ", and other test stays share these photographs"}. {source}
              </p>
            </div>
            {/* One large picture and two smaller ones beside it: a more deliberate shape than three equal tiles. */}
            <ul className="mt-14 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
              {listing.photos.map((photo, index) => (
                <li key={photo.src} className={`relative overflow-hidden ${index === 0 ? "aspect-[3/2] lg:col-span-2 lg:row-span-2 lg:aspect-auto" : "aspect-[3/2]"}`}>
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes={index === 0 ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/*
          Phones only: price and Reserve stay at the bottom of the screen while the visitor scrolls,
          so booking is always one tap away. "sticky" keeps it inside the page, so it never covers the footer.
        */}
        <div className="sticky bottom-0 z-20 order-last flex items-center justify-between gap-4 border-t border-sand-deep bg-paper/95 px-6 py-3 backdrop-blur sm:hidden">
          <p className="text-sm text-stone">
            <span className="display text-xl text-ink">{price}</span> a night
          </p>
          <Link href={`/stays/${listing.slug}/book`} className="eyebrow bg-navy px-8 py-4 text-white">
            Reserve
          </Link>
        </div>

        <section aria-labelledby="more-heading" className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <p className="eyebrow text-center text-stone">Keep looking</p>
          <h2 id="more-heading" className="display mt-6 text-center text-5xl sm:text-6xl">
            More in {listing.location}
          </h2>
          <ul className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((other) => (
              <li key={other.id}>
                <StayCard listing={other} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
              </li>
            ))}
          </ul>
          <p className="mt-14 text-center">
            <Link href="/stays" className="text-link">
              Browse all stays
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
