// Turns the text in a web address into a search, and a search back into a web address.
//
// Search filters live in the address (for example /stays?region=Whale+Coast&guests=2&page=3) and
// nowhere else. That is what makes a search shareable, bookmarkable and safe to reload, and it is why
// the Back button works. Anything in an address can be typed by anyone, so every value is checked here
// and anything unexpected is quietly dropped rather than trusted.

import { REGIONS } from "./generate.ts";
import { SORTS, type SearchQuery, type Sort, type StayType } from "./types.ts";

const TYPES: StayType[] = ["Room", "Studio", "House"];

export type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

const wholeNumber = (value: string | undefined, min: number, max: number): number | undefined => {
  if (!value || !/^\d{1,6}$/.test(value)) return undefined;
  const number = Number(value);
  return number >= min && number <= max ? number : undefined;
};

export function parseSearch(params: RawParams): SearchQuery {
  const region = first(params.region);
  const type = first(params.type);
  const sort = first(params.sort);
  const maxRand = wholeNumber(first(params.max), 100, 100_000);
  return {
    text: first(params.q)?.slice(0, 60).trim() || undefined,
    region: REGIONS.find((item) => item === region),
    type: TYPES.find((item) => item === type),
    guests: wholeNumber(first(params.guests), 1, 12),
    maxRateMinor: maxRand ? maxRand * 100 : undefined,
    sort: SORTS.find((item) => item === sort) as Sort | undefined,
    page: wholeNumber(first(params.page), 1, 100_000),
  };
}

/** The address for a search. Empty filters and page 1 are left out, so addresses stay short. */
export function searchHref(query: SearchQuery, changes: Partial<SearchQuery> = {}): string {
  const next = { ...query, ...changes };
  const params = new URLSearchParams();
  if (next.text) params.set("q", next.text);
  if (next.region) params.set("region", next.region);
  if (next.type) params.set("type", next.type);
  if (next.guests) params.set("guests", String(next.guests));
  if (next.maxRateMinor) params.set("max", String(next.maxRateMinor / 100));
  if (next.sort && next.sort !== "recommended") params.set("sort", next.sort);
  if (next.page && next.page > 1) params.set("page", String(next.page));
  const text = params.toString();
  return text ? `/stays?${text}` : "/stays";
}
