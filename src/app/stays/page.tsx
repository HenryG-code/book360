import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { StayCard } from "@/components/StayCard";
import { parseSearch, searchHref, type RawParams } from "@/catalogue/query";
import { repository } from "@/catalogue/repository";

export const metadata: Metadata = { title: "All stays" };

// The search page. It is rendered on the server for every request, because the answer depends on the
// filters in the address. The filter form is a plain HTML form that submits with GET, so it puts the
// filters into the address by itself and the page needs no JavaScript at all.
//
// Only one page of results (24 stays) is ever sent, however large the catalogue is.

const field = "h-12 w-full border border-ink/20 bg-white px-3 text-[0.9375rem] text-ink";
const label = "eyebrow mb-2 block text-stone";

/** Page numbers to show: the first, the last and a few around the current one. 0 stands for a gap. */
function pageNumbers(page: number, pageCount: number): number[] {
  const wanted = new Set([1, pageCount, page - 1, page, page + 1].filter((number) => number >= 1 && number <= pageCount));
  const sorted = [...wanted].sort((a, b) => a - b);
  return sorted.flatMap((number, index) => (index > 0 && number - sorted[index - 1]! > 1 ? [0, number] : [number]));
}

export default async function StaysPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const query = parseSearch(await searchParams);
  const [result, regions, total] = await Promise.all([repository.search(query), repository.regions(), repository.count()]);
  const filtered = Boolean(query.text || query.region || query.type || query.guests || query.maxRateMinor);
  const count = new Intl.NumberFormat("en-ZA");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 pb-28 pt-12 lg:px-10 lg:pt-20">
        <p className="eyebrow text-stone">{count.format(total)} stays, each with a 360° tour</p>
        <h1 className="display mt-5 text-5xl sm:text-7xl">Find a Stay</h1>

        <form action="/stays" method="get" role="search" aria-label="Filter stays" className="mt-10 bg-sand p-5 sm:p-7">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <div className="col-span-2">
              <label htmlFor="q" className={label}>Name or place</label>
              <input id="q" name="q" type="search" defaultValue={query.text} placeholder="Try “lodge” or “coast”" className={field} />
            </div>
            <div>
              <label htmlFor="region" className={label}>Region</label>
              <select id="region" name="region" defaultValue={query.region ?? ""} className={field}>
                <option value="">Anywhere</option>
                {regions.map((region) => <option key={region}>{region}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="type" className={label}>Type</label>
              <select id="type" name="type" defaultValue={query.type ?? ""} className={field}>
                <option value="">Any type</option>
                <option>Room</option>
                <option>Studio</option>
                <option>House</option>
              </select>
            </div>
            <div>
              <label htmlFor="guests" className={label}>Guests</label>
              <select id="guests" name="guests" defaultValue={query.guests ?? ""} className={field}>
                <option value="">Any</option>
                {[1, 2, 3, 4, 6, 8, 10].map((guests) => <option key={guests} value={guests}>{guests}+</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="max" className={label}>Price up to</label>
              <select id="max" name="max" defaultValue={query.maxRateMinor ? query.maxRateMinor / 100 : ""} className={field}>
                <option value="">Any price</option>
                {[1500, 2500, 3500, 5000].map((rand) => <option key={rand} value={rand}>R {count.format(rand)}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div className="w-full sm:w-56">
              <label htmlFor="sort" className={label}>Sort by</label>
              <select id="sort" name="sort" defaultValue={query.sort ?? "recommended"} className={field}>
                <option value="recommended">Recommended</option>
                <option value="price-asc">Price, low to high</option>
                <option value="price-desc">Price, high to low</option>
              </select>
            </div>
            <div className="flex w-full items-center gap-6 sm:w-auto">
              {filtered ? <Link href="/stays" className="text-link">Clear filters</Link> : null}
              <button type="submit" className="eyebrow h-12 flex-1 bg-navy px-10 text-white transition-colors hover:bg-navy-deep sm:flex-none">
                Search
              </button>
            </div>
          </div>
        </form>

        <p role="status" className="mt-10 text-sm text-stone">
          {result.total === 0
            ? "No stays match those filters."
            : `${count.format(result.total)} ${result.total === 1 ? "stay" : "stays"} found. Page ${result.page} of ${count.format(result.pageCount)}.`}
        </p>

        {result.total === 0 ? (
          <p className="mt-6">
            <Link href="/stays" className="text-link">See every stay</Link>
          </p>
        ) : (
          <ul className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((listing) => (
              <li key={listing.id}>
                <StayCard listing={listing} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
              </li>
            ))}
          </ul>
        )}

        {result.pageCount > 1 ? (
          <nav aria-label="Pages" className="mt-16 flex flex-wrap items-center justify-center gap-2 border-t border-ink/15 pt-8">
            {result.page > 1 ? (
              <Link href={searchHref(query, { page: result.page - 1 })} rel="prev" className="eyebrow flex h-11 items-center border border-ink/20 px-5">
                Previous
              </Link>
            ) : null}
            {pageNumbers(result.page, result.pageCount).map((number, index) =>
              number === 0 ? (
                <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-stone">…</span>
              ) : (
                <Link
                  key={number}
                  href={searchHref(query, { page: number })}
                  aria-label={`Page ${number}`}
                  aria-current={number === result.page ? "page" : undefined}
                  className={`flex h-11 min-w-11 items-center justify-center px-3 text-sm ${
                    number === result.page ? "bg-navy text-white" : "border border-ink/20"
                  }`}
                >
                  {number}
                </Link>
              ),
            )}
            {result.page < result.pageCount ? (
              <Link href={searchHref(query, { page: result.page + 1 })} rel="next" className="eyebrow flex h-11 items-center border border-ink/20 px-5">
                Next
              </Link>
            ) : null}
          </nav>
        ) : null}

        <p className="mt-12 border-l border-navy pl-5 text-sm leading-relaxed text-stone">
          <strong className="font-medium text-ink">Real rooms, invented stays.</strong> Every stay has its own real 360°
          photograph, and no photograph appears twice. The names, places and prices are invented for this demo.
        </p>
      </main>
    </>
  );
}
