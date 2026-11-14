// Hard-coded listings for the feasibility prototype. Slice 2 replaces this with typed seed data
// validated by Zod.
//
// The stays are invented: their names, places and prices are made up. The pictures are real. Each
// stay uses one 360-degree photograph from Poly Haven, released under CC0, and its gallery photos are
// cut from that same photograph by scripts/prepare-media.mjs. Full credits are in CREDITS.md.

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

export type Listing = {
  slug: string;
  name: string;
  location: string;
  kicker: string;
  /** A short line used as the big heading on the home page. */
  tagline: string;
  summary: string;
  /** Integer minor units (cents), never a decimal number, so sums cannot pick up rounding errors. */
  nightlyRateMinor: number;
  currency: "ZAR";
  sleeps: number;
  photos: [Photo, Photo, Photo];
  tour: Tour;
  credit: Credit;
};

const photos = (slug: string, alts: [string, string, string]): [Photo, Photo, Photo] =>
  alts.map((alt, index) => ({ src: `/media/${slug}-${index + 1}.jpg`, alt, width: 1600, height: 1067 })) as [
    Photo,
    Photo,
    Photo,
  ];

// The tour opens facing the same way as the first gallery photo, so the poster and the tour agree.
const tour = (slug: string, startYaw: number): Tour => ({ panorama: `/media/${slug}-pano.jpg`, width: 4096, startYaw });

export const listings: Listing[] = [
  {
    slug: "cliffside-suite",
    name: "Cliffside Suite",
    location: "Whale Coast",
    kicker: "Sea-facing suite",
    tagline: "Wake Up Above the Treetops",
    summary: "Sliding doors open onto a balcony above the treetops, with the sea beyond. Two beds side by side, a reading chair and a quiet corner.",
    nightlyRateMinor: 285000,
    currency: "ZAR",
    sleeps: 2,
    photos: photos("cliffside-suite", [
      "Two beds side by side with white linen and red cushions, under three pictures of boats",
      "Sliding glass doors opening onto a tiled balcony, with trees and the sea beyond",
      "A patterned armchair and a small round table beneath a round wicker mirror, beside built-in cupboards",
    ]),
    tour: tour("cliffside-suite", 112),
    credit: {
      asset: "relax_inn_seaview_suite",
      title: "Relax Inn Seaview Suite",
      author: "Dario Barresi (photography) and Jenelle van Heerden (processing)",
      licence: "CC0 1.0",
    },
  },
  {
    slug: "glass-house",
    name: "Glass House",
    location: "High Plateau",
    kicker: "Open-plan hideaway",
    tagline: "Glass on Every Side, a Valley Below",
    summary: "Steel-framed windows on every side, a stone fireplace and a bed that faces the valley. There is a telescope for the evenings.",
    nightlyRateMinor: 342000,
    currency: "ZAR",
    sleeps: 2,
    photos: photos("glass-house", [
      "A bed with white linen in the corner of a glass-walled room, looking out over a dry valley",
      "A worn wooden dining table with four white chairs in front of a stone fireplace",
      "A daybed with floral cushions and a brass telescope against a wall of windows",
    ]),
    tour: tour("glass-house", -78),
    credit: { asset: "glasshouse_interior", title: "Glasshouse Interior", author: "Dario Barresi", licence: "CC0 1.0" },
  },
  {
    slug: "city-room",
    name: "City Room",
    location: "Old Quarter",
    kicker: "Room for two",
    tagline: "A Quiet Room in the Middle of It All",
    summary: "A calm room with a wide curtained window, a writing desk and one bright yellow chair.",
    nightlyRateMinor: 164000,
    currency: "ZAR",
    sleeps: 2,
    photos: photos("city-room", [
      "A double bed with white pillows between dark wood panels, with a mirror above the headboard",
      "A yellow armchair beside a tall window with sheer curtains",
      "A dark desk with a chrome lamp and a kettle, under a wall-mounted television",
    ]),
    tour: tour("city-room", 112),
    credit: { asset: "hotel_room", title: "Hotel Room", author: "Greg Zaal", licence: "CC0 1.0" },
  },
];

/** The home page picture. It is not a stay, so it lives outside the listings. */
export const heroCredit: Credit = {
  asset: "illovo_beach_balcony",
  title: "Illovo Beach Balcony",
  author: "Greg Zaal",
  licence: "CC0 1.0",
};

export const assetPage = (credit: Credit): string => `https://polyhaven.com/a/${credit.asset}`;

export const findListing = (slug: string): Listing | undefined => listings.find((listing) => listing.slug === slug);

export const formatMoney = (minor: number, currency: string): string =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
