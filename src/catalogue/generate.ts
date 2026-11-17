// Builds the catalogue: three hand-written stays, then as many generated ones as asked for.
//
// Why generate? The point of this stage is to find out whether the site still works with thousands of
// stays: does search stay fast, do pages still build, does paging hold up. Nobody can hand-write
// thousands of stays, so they are produced by a recipe.
//
// The recipe is deterministic: stay number 1,804 has the same name, place and price every time, on
// every machine. That is what a "seeded" random generator gives you, and it matters because a URL for
// a stay must keep pointing at the same stay after a restart.

import { roomByKey, rooms } from "./rooms.ts";
import type { Listing, Room, StayType } from "./types.ts";

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

const fromRoom = (room: Room) => ({ roomKey: room.key, photos: room.photos, tour: room.tour, credit: room.credit });

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
    summary: "Sliding doors open onto a balcony above the treetops, with the sea beyond. Two beds side by side, a reading chair and a quiet corner.",
    nightlyRateMinor: 285000,
    cleaningFeeMinor: 45000,
    currency: "ZAR",
    sleeps: 2,
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
    summary: "Steel-framed windows on every side, a stone fireplace and a bed that faces the valley. There is a telescope for the evenings.",
    nightlyRateMinor: 342000,
    cleaningFeeMinor: 60000,
    currency: "ZAR",
    sleeps: 2,
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
    sleeps: 2,
    amenities: ["Wi-Fi", "Desk", "Air conditioning", "Late check-out"],
    featured: true,
    ...fromRoom(room("city-room")),
  },
];

function generated(id: number): Listing {
  const random = seeded(id * 7919);
  const space = pick(rooms, random);
  const region = pick(REGIONS, random);
  const name = `${pick(ADJECTIVES, random)} ${pick(NOUNS[space.type], random)}`;
  const sleeps = space.type === "House" ? 4 + Math.floor(random() * 5) : space.type === "Studio" ? 2 + Math.floor(random() * 2) : 1 + Math.floor(random() * 2);
  // Prices land on round hundreds of rand, in cents. Bigger places cost more.
  const base = space.type === "House" ? 2600 : space.type === "Studio" ? 1500 : 900;
  const nightly = (base + Math.floor(random() * 28) * 100) * 100;
  const amenities = AMENITIES.filter(() => random() < 0.38);

  return {
    id,
    // The number keeps every address unique, because names repeat: there are only so many word pairs.
    slug: `${slugify(name)}-${id}`,
    name,
    location: region,
    type: space.type,
    kicker: `${space.type} for ${sleeps === 1 ? "one" : sleeps}`,
    tagline: pick(TAGLINES, random),
    summary: `A ${space.type.toLowerCase()} in ${region} that sleeps ${sleeps}. This is a generated test stay: the name, place and price are invented, and the photographs are shared with other stays.`,
    nightlyRateMinor: nightly,
    cleaningFeeMinor: Math.round(nightly * 0.15 / 5000) * 5000,
    currency: "ZAR",
    sleeps,
    amenities: amenities.length > 0 ? amenities : ["Wi-Fi"],
    featured: false,
    ...fromRoom(space),
  };
}

/** The whole catalogue, `size` stays long. Building 2,400 takes a few milliseconds. */
export function buildCatalogue(size: number): Listing[] {
  const all = [...FEATURED];
  for (let id = FEATURED.length + 1; id <= size; id++) all.push(generated(id));
  return all;
}
