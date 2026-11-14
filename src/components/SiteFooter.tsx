import Link from "next/link";
import { Mark, Wordmark } from "@/components/Mark";
import { listings } from "@/data/listings";

const column = "eyebrow text-white/45";
const item = "block py-3 text-sm text-white/80 transition-colors hover:text-white";

export function SiteFooter() {
  return (
    <footer className="on-dark relative overflow-hidden bg-ink text-white">
      {/* A very large, very faint copy of the mark. It is decoration only. */}
      <Mark className="pointer-events-none absolute -bottom-40 -left-32 size-[38rem] text-white/[0.04]" />
      <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-20 lg:px-10">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="display text-4xl sm:text-5xl">
              Know the Room
              <br />
              Before You Book
            </p>
          </div>
          <div className="lg:col-span-2">
            <h2 className={column}>Explore</h2>
            <ul className="mt-3">
              <li><Link href="/#idea" className={item}>The idea</Link></li>
              <li><Link href="/#how" className={item}>How it works</Link></li>
              <li><Link href="/#questions" className={item}>Questions</Link></li>
            </ul>
          </div>
          <div className="lg:col-span-2">
            <h2 className={column}>Stays</h2>
            <ul className="mt-3">
              {listings.map((listing) => (
                <li key={listing.slug}>
                  <Link href={`/stays/${listing.slug}`} className={item}>{listing.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-3">
            <h2 className={column}>About</h2>
            <p className="mt-5 text-sm leading-relaxed text-white/70">
              A portfolio demo. Nothing here reserves a real room, and no payment is ever taken.
            </p>
            <Link href="/credits" className="text-link mt-5">Photo credits</Link>
          </div>
        </div>
        <div className="mt-20 flex flex-col gap-4 border-t sm:flex-row sm:items-center sm:justify-between border-white/15 pt-6 text-xs text-white/50">
          <span className="flex items-center gap-2 text-white/80">
            <Mark className="size-7" />
            <Wordmark className="text-xs" />
          </span>
          <span>Demo site. Photographs: Poly Haven, CC0.</span>
        </div>
      </div>
    </footer>
  );
}
