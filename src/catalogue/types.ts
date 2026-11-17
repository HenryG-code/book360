// The shapes of the data. Everything else in the catalogue is written against these types.

export type Photo = { src: string; alt: string; width: number; height: number };

/** Who made a photograph and where it came from. Shown to visitors and repeated in CREDITS.md. */
export type Credit = {
  /** Asset id on Poly Haven. The asset page is https://polyhaven.com/a/<id>. */
  asset: string;
  title: string;
  author: string;
  licence: "CC0 1.0";
};

export type Tour = {
  panorama: string;
  /** Pixel width of the panorama. Marzipano needs it to pick a texture size. */
  width: number;
  /** Direction the tour faces when it opens, in degrees right of the photograph's centre. */
  startYaw: number;
};

export type StayType = "Room" | "Studio" | "House";

/** Kinds of bed, and how many people each one sleeps. */
export type BedKind = "king" | "queen" | "double" | "single" | "daybed" | "sofa bed";

export type Bed = { kind: BedKind; count: number };

/** A photographed space: the real part of a stay. */
export type Room = {
  key: string;
  type: StayType;
  /**
   * The beds the photograph shows. For a room or studio this is the whole sleeping space, so every stay
   * using the photograph has exactly these beds. A house's photograph shows its living room, so its
   * bedrooms are listed per stay instead, and this is empty.
   */
  beds: Bed[];
  photos: [Photo, Photo, Photo];
  tour: Tour;
  credit: Credit;
};

/** A stay someone can book: the invented part, pointing at one photographed room. */
export type Listing = {
  /** Position in the catalogue, starting at 1. Stable, so it can sit in a URL. */
  id: number;
  slug: string;
  name: string;
  /** The region. Kept under the old field name so existing pages keep working. */
  location: string;
  type: StayType;
  kicker: string;
  /** A short line used as a large heading. */
  tagline: string;
  summary: string;
  /** Integer minor units (cents), never a decimal number, so sums cannot pick up rounding errors. */
  nightlyRateMinor: number;
  cleaningFeeMinor: number;
  currency: "ZAR";
  /** Always worked out from the beds (see src/catalogue/beds.ts), never chosen separately. */
  sleeps: number;
  beds: Bed[];
  /** Separate bedrooms. A room counts as one; a studio is open plan, so it has none. */
  bedrooms: number;
  amenities: string[];
  /** Hand-written stays shown on the home page. */
  featured: boolean;
  roomKey: string;
  // Copied from the room so a page needs only the listing.
  photos: [Photo, Photo, Photo];
  tour: Tour;
  credit: Credit;
};

export const SORTS = ["recommended", "price-asc", "price-desc"] as const;
export type Sort = (typeof SORTS)[number];

/** What a visitor asked for. Every field is optional: an empty query means "everything". */
export type SearchQuery = {
  text?: string;
  region?: string;
  type?: StayType;
  guests?: number;
  maxRateMinor?: number;
  sort?: Sort;
  page?: number;
};

export type SearchResult = {
  items: Listing[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
};

/**
 * The one doorway to stay data. Pages call these methods and never touch the data behind them.
 *
 * Today the data is generated in memory. When it moves to a database, a second implementation of this
 * interface replaces the first, and no page changes. The methods return promises for that reason:
 * a database answers later, not at once.
 */
export interface ListingRepository {
  count(): Promise<number>;
  get(slug: string): Promise<Listing | undefined>;
  featured(): Promise<Listing[]>;
  search(query: SearchQuery): Promise<SearchResult>;
  regions(): Promise<string[]>;
  /** A few other stays to suggest beside this one. */
  related(listing: Listing, limit: number): Promise<Listing[]>;
}
