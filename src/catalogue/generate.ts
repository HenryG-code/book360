// Builds the catalogue: three hand-written stays, then as many generated ones as asked for.
//
// Why generate? There are only so many real 360-degree photographs to be had, so each photographed room
// gets one invented stay around it: a name, a region, beds and a price. A seeded recipe produces them,
// so the same stay has the same details on every machine and after every restart, and its address can
// be shared.

import { describeBeds, PER_GUEST_BAND, sleepsFor } from "./beds.ts";
import { roomByKey, rooms } from "./rooms.ts";
import type { Bed, BedKind, Listing, Room, StayType } from "./types.ts";

export const REGIONS = [
  "Whale Coast",
  "High Plateau",
  "Old Quarter",
  "Cedar Valley",
  "Salt Flats",
  "Northern Lakes",
  "Vine Country",
  "Granite Ridge",
  "River Mouth",
  "Dune Belt",
  "Market District",
  "Forest Edge",
] as const;

const ADJECTIVES = [
  "Quiet", "Amber", "Slate", "Olive", "Harbour", "Lantern", "Cedar", "Juniper", "Marigold", "Copper", "Linen",
  "Willow", "Saffron", "Heron", "Tidewater", "Ember", "Morning", "Stonewall", "Bluegum", "Fennel", "Driftwood",
  "Sunward", "Hilltop", "Orchard", "Starling", "Kestrel", "Foxglove", "Brackish", "Windfall", "Longshadow",
];

const NOUNS: Record<StayType, string[]> = {
  Room: ["Room", "Suite", "Quarters", "Hideaway", "Nook", "Chamber"],
  Studio: ["Studio", "Loft", "Atelier", "Flat", "Garret", "Perch"],
  House: ["House", "Lodge", "Cottage", "Villa", "Homestead", "Retreat"],
};

const AMENITIES = [
  "Wi-Fi", "Breakfast", "Parking", "Air conditioning", "Kitchenette", "Fireplace", "Balcony", "Desk",
  "Washing machine", "Pets welcome", "Step-free access", "Late check-out",
];

const TAGLINES = [
  "A Calm Place to Land",
  "Room to Breathe, Close to Everything",
  "Slow Mornings, Long Evenings",
  "Simple, Warm and Well Kept",
  "Light on Every Side",
  "Somewhere to Put Your Bags Down",
];

/** A small, fast random-number recipe. The same seed always produces the same sequence. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(items: readonly T[], random: () => number): T => items[Math.floor(random() * items.length)]!;

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const fromRoom = (room: Room) => ({
  roomKey: room.key,
  scene: room.scene,
  bathroom: room.bathroom,
  photos: room.photos,
  tour: room.tour,
  credit: room.credit,
});

/** A room or studio sleeps exactly what its photograph shows. A room is one bedroom; a studio is open plan. */
const photographedBeds = (room: Room) => ({
  beds: room.beds.map((bed) => ({ ...bed })),
  sleeps: sleepsFor(room.beds),
  bedrooms: room.type === "Room" ? 1 : 0,
});

/**
 * A house's bedrooms are not in its photograph (that shows the living room), so they are listed: two to
 * four bedrooms, each with one bed for two or two single beds, and sometimes a sofa bed in the lounge.
 */
function houseBeds(random: () => number) {
  const bedrooms = 2 + Math.floor(random() * 3);
  const counts = new Map<BedKind, number>();
  const add = (kind: BedKind, count: number) => counts.set(kind, (counts.get(kind) ?? 0) + count);
  for (let i = 0; i < bedrooms; i++) {
    const roll = random();
    if (roll < 0.2) add("king", 1);
    else if (roll < 0.45) add("queen", 1);
    else if (roll < 0.65) add("double", 1);
    else add("single", 2);
  }
  if (random() < 0.35) add("sofa bed", 1);
  const order: BedKind[] = ["king", "queen", "double", "single", "daybed", "sofa bed"];
  const beds: Bed[] = order.filter((kind) => counts.has(kind)).map((kind) => ({ kind, count: counts.get(kind)! }));
  return { beds, sleeps: sleepsFor(beds), bedrooms };
}

/** A nightly rate inside the type's per-guest band, rounded to whole hundreds of rand, in cents. */
function nightlyRate(type: StayType, sleeps: number, random: () => number): number {
  const band = PER_GUEST_BAND[type];
  // Keeping R50 clear of each edge means rounding the total to R100 can never push it outside the band.
  const perGuest = band.min + 50 + random() * (band.max - band.min - 100);
  return Math.round((sleeps * perGuest) / 100) * 100 * 100;
}

const NUMBER_NAMES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

function kickerFor(type: StayType, sleeps: number, bedrooms: number): string {
  if (type === "House") return `${bedrooms}-bedroom house`;
  return `${type} for ${NUMBER_NAMES[sleeps] ?? sleeps}`;
}

const room = (key: string): Room => {
  const found = roomByKey.get(key);
  if (!found) throw new Error(`Unknown room "${key}"`);
  return found;
};

/** The three stays written by hand. They lead the home page and keep their short, clean addresses. */
const FEATURED: Listing[] = [
  {
    id: 1,
    slug: "cliffside-suite",
    name: "Cliffside Suite",
    location: "Whale Coast",
    type: "Room",
    kicker: "Sea-facing suite",
    tagline: "Wake Up Above the Treetops",
    summary: "Sliding doors open onto a balcony above the treetops, with the sea beyond. Two single beds side by side, a reading chair and a quiet corner.",
    nightlyRateMinor: 285000,
    cleaningFeeMinor: 45000,
    currency: "ZAR",
    ...photographedBeds(room("cliffside-suite")),
    amenities: ["Balcony", "Wi-Fi", "Air conditioning", "Parking"],
    featured: true,
    ...fromRoom(room("cliffside-suite")),
  },
  {
    id: 2,
    slug: "glass-house",
    name: "Glass House",
    location: "High Plateau",
    type: "Studio",
    kicker: "Open-plan hideaway",
    tagline: "Glass on Every Side, a Valley Below",
    summary: "Steel-framed windows on every side, a stone fireplace and a double bed that faces the valley, with a daybed by the telescope for a third guest.",
    nightlyRateMinor: 342000,
    cleaningFeeMinor: 60000,
    currency: "ZAR",
    ...photographedBeds(room("glass-house")),
    amenities: ["Fireplace", "Kitchenette", "Parking", "Pets welcome"],
    featured: true,
    ...fromRoom(room("glass-house")),
  },
  {
    id: 3,
    slug: "city-room",
    name: "City Room",
    location: "Old Quarter",
    type: "Room",
    kicker: "Room for two",
    tagline: "A Quiet Room in the Middle of It All",
    summary: "A calm room with a wide curtained window, a writing desk and one bright yellow chair.",
    nightlyRateMinor: 164000,
    cleaningFeeMinor: 30000,
    currency: "ZAR",
    ...photographedBeds(room("city-room")),
    amenities: ["Wi-Fi", "Desk", "Air conditioning", "Late check-out"],
    featured: true,
    ...fromRoom(room("city-room")),
  },
];

/**
 * One invented stay around a photographed room. Everything about it comes from a seeded recipe, so stay
 * number 12 has the same name, place and price on every machine and after every restart.
 */
function generated(id: number, space: Room, shared: boolean): Listing {
  const random = seeded(id * 7919);
  const region = pick(REGIONS, random);
  const name = `${pick(ADJECTIVES, random)} ${pick(NOUNS[space.type], random)}`;
  // Beds first; guests, size and price all follow from them.
  const { beds, sleeps, bedrooms } = space.type === "House" ? houseBeds(random) : photographedBeds(space);
  const nightly = nightlyRate(space.type, sleeps, random);
  const amenities = AMENITIES.filter(() => random() < 0.38);
  const place =
    space.type === "House" ? `A ${bedrooms}-bedroom house` : space.type === "Studio" ? "An open-plan studio" : "A room";
  const shown =
    space.type === "House" ? ` The tour shows ${space.scene}; the bedrooms are listed, not photographed.` : "";
  const photos = shared ? " Its photographs are shared with other test stays." : "";

  return {
    id,
    // The number keeps every address unique, because names repeat: there are only so many word pairs.
    slug: `${slugify(name)}-${id}`,
    name,
    location: region,
    type: space.type,
    kicker: kickerFor(space.type, sleeps, bedrooms),
    tagline: pick(TAGLINES, random),
    summary: `${place} in ${region} with ${describeBeds(beds)}, sleeping ${sleeps}.${shown} The name, place and price are invented for this demo.${photos}`,
    nightlyRateMinor: nightly,
    cleaningFeeMinor: Math.round((nightly * 0.15) / 5000) * 5000,
    currency: "ZAR",
    sleeps,
    beds,
    bedrooms,
    amenities: amenities.length > 0 ? amenities : ["Wi-Fi"],
    featured: false,
    ...fromRoom(space),
  };
}

/**
 * The catalogue the site shows: the hand-written stays, then one generated stay for every other
 * photographed room, in order. Every stay has its own photograph; none appears twice.
 *
 * A larger `size` is only for testing how the code copes with scale (npm run bench, unit tests). The
 * extra stays then reuse photographs, and say so, because there are not thousands of real rooms.
 */
export function buildCatalogue(size?: number): Listing[] {
  const all = [...FEATURED];
  const taken = new Set(FEATURED.map((listing) => listing.roomKey));
  for (const space of rooms) {
    if (!taken.has(space.key)) all.push(generated(all.length + 1, space, false));
  }
  for (let id = all.length + 1; size !== undefined && id <= size; id++) {
    all.push(generated(id, pick(rooms, seeded(id * 104729)), true));
  }
  return size === undefined ? all : all.slice(0, Math.max(size, FEATURED.length));
}
