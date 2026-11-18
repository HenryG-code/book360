// A small front door to the catalogue, kept so pages have one short import.
// The data itself lives in src/catalogue.

import { repository } from "@/catalogue/repository";

export type { Credit, Listing, Photo, Tour } from "@/catalogue/types";
export { assetPage, bathrooms, heroCredit, rooms } from "@/catalogue/rooms";

export const findListing = (slug: string) => repository.get(slug);

export const formatMoney = (minor: number, currency: string): string =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
