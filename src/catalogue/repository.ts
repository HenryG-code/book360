// The in-memory catalogue. It is the only implementation of ListingRepository so far.
//
// How it copes with size:
//   - get() looks a stay up in a Map, which takes the same time for 3 stays or 300,000.
//   - search() reads every stay once per request. That is fine into the tens of thousands, and is the
//     first thing a database index would replace (see docs/adr/0002).
//   - search() never returns the whole catalogue, only one page of it, so the size of a response does
//     not grow with the catalogue.

import { buildCatalogue, REGIONS } from "./generate.ts";
import type { Listing, ListingRepository, SearchQuery, SearchResult } from "./types.ts";

export const PAGE_SIZE = 12;

/**
 * By default the site shows one stay per photographed room. For load tests only, BOOK360_CATALOGUE_SIZE
 * builds a bigger catalogue whose extra stays reuse photographs (see buildCatalogue).
 */
const size = Number(process.env.BOOK360_CATALOGUE_SIZE) || undefined;

class MemoryRepository implements ListingRepository {
  private readonly all: Listing[];
  private readonly bySlug: Map<string, Listing>;

  constructor(listings: Listing[]) {
    this.all = listings;
    this.bySlug = new Map(listings.map((listing) => [listing.slug, listing]));
  }

  async count() {
    return this.all.length;
  }

  async get(slug: string) {
    return this.bySlug.get(slug);
  }

  async featured() {
    return this.all.filter((listing) => listing.featured);
  }

  async regions() {
    return [...REGIONS];
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const text = query.text?.trim().toLowerCase();
    const matches = this.all.filter(
      (listing) =>
        (!text || listing.name.toLowerCase().includes(text) || listing.location.toLowerCase().includes(text)) &&
        (!query.region || listing.location === query.region) &&
        (!query.type || listing.type === query.type) &&
        (!query.guests || listing.sleeps >= query.guests) &&
        (!query.maxRateMinor || listing.nightlyRateMinor <= query.maxRateMinor),
    );

    if (query.sort === "price-asc") matches.sort((a, b) => a.nightlyRateMinor - b.nightlyRateMinor || a.id - b.id);
    else if (query.sort === "price-desc") matches.sort((a, b) => b.nightlyRateMinor - a.nightlyRateMinor || a.id - b.id);
    // "recommended" keeps catalogue order: the hand-written stays first.

    const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
    // A page number past the end shows the last page instead of an empty one.
    const page = Math.min(Math.max(1, query.page ?? 1), pageCount);
    return {
      items: matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      total: matches.length,
      page,
      pageCount,
      pageSize: PAGE_SIZE,
    };
  }

  async related(listing: Listing, limit: number) {
    // Same region first, then the same type of stay, then anything, so the list is never short.
    const others = this.all.filter((other) => other.id !== listing.id);
    const ranked = [
      ...others.filter((other) => other.location === listing.location),
      ...others.filter((other) => other.location !== listing.location && other.type === listing.type),
      ...others.filter((other) => other.location !== listing.location && other.type !== listing.type),
    ];
    return ranked.slice(0, limit);
  }
}

// Built once when the server starts, then shared by every request.
export const repository: ListingRepository = new MemoryRepository(buildCatalogue(size));
