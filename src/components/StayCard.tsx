import Image from "next/image";
import Link from "next/link";
import { formatMoney, type Listing } from "@/data/listings";

/** One stay in a grid. The whole card is a single link, so it is one large, easy target on a phone. */
export function StayCard({ listing, sizes }: { listing: Listing; sizes: string }) {
  return (
    <Link href={`/stays/${listing.slug}`} className="group block">
      <div className="relative aspect-[3/2] overflow-hidden bg-sand-deep">
        <Image
          src={listing.photos[0].src}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
        />
        <span className="absolute left-3 top-3 bg-white/90 px-2.5 py-1 text-[0.625rem] font-medium tracking-[0.18em] text-ink">
          360°
        </span>
      </div>
      <p className="eyebrow mt-5 text-stone">
        {listing.type} · {listing.location}
      </p>
      <p className="display mt-2 text-2xl">{listing.name}</p>
      <p className="mt-2 text-sm text-stone">
        <span className="text-ink">{formatMoney(listing.nightlyRateMinor, listing.currency)}</span> a night · sleeps{" "}
        {listing.sleeps}
      </p>
    </Link>
  );
}
