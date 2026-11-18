// The photographed rooms. Every stay in the catalogue points at one of these.
//
// A room is the real part: one 360-degree photograph from Poly Haven or ambientCG (both CC0) and
// three gallery pictures cut from it by scripts/prepare-media.mjs. A stay (see types.ts) is the
// invented part: a name, a place and a price. Every stay on the site has its own room: no photograph
// appears on two stays.

import type { Bed, Credit, ExtraTour, Photo, Room, StayType } from "./types.ts";

/** Counted from each photograph by eye. A house's photograph shows its living room, not its bedrooms. */
const LIVING_ROOM: Bed[] = [];

const credit = (asset: string, title: string, author: string, source: Credit["source"] = "Poly Haven"): Credit => ({
  source,
  asset,
  title,
  author,
  licence: "CC0 1.0",
});

const room = (
  key: string,
  type: StayType,
  beds: Bed[],
  startYaw: number,
  alts: [string, string, string],
  source: Credit,
): Omit<Room, "scene" | "bathroom"> => ({
  key,
  type,
  beds,
  photos: alts.map((alt, index) => ({ src: `/media/${key}-${index + 1}.jpg`, alt, width: 1600, height: 1067 })) as [
    Photo,
    Photo,
    Photo,
  ],
  // The tour opens facing the same way as the first gallery photo, so the poster and the tour agree.
  tour: { panorama: `/media/${key}-pano.jpg`, width: 4096, startYaw },
  credit: source,
});

const GREG = "Greg Zaal";
const SERGEJ = "Sergej Majboroda";
const DARIO = "Dario Barresi";
const ACG_AUTHOR = "ambientCG (Lennart Demes)";

const photographed = [
  room(
    "cliffside-suite",
    "Room",
    [{ kind: "single", count: 2 }],
    112,
    [
      "Two single beds side by side with white linen and red cushions, under three pictures of boats",
      "Sliding glass doors opening onto a tiled balcony, with trees and the sea beyond",
      "A patterned armchair and a small round table beneath a round wicker mirror, beside built-in cupboards",
    ],
    credit("relax_inn_seaview_suite", "Relax Inn Seaview Suite", `${DARIO} (photography) and Jenelle van Heerden (processing)`),
  ),
  room(
    "glass-house",
    "Studio",
    [{ kind: "double", count: 1 }, { kind: "daybed", count: 1 }],
    -78,
    [
      "A bed with white linen in the corner of a glass-walled room, looking out over a dry valley",
      "A worn wooden dining table with four white chairs in front of a stone fireplace",
      "A daybed with floral cushions and a brass telescope against a wall of windows",
    ],
    credit("glasshouse_interior", "Glasshouse Interior", DARIO),
  ),
  room(
    "city-room",
    "Room",
    [{ kind: "double", count: 1 }],
    112,
    [
      "A double bed with white pillows between dark wood panels, with a mirror above the headboard",
      "A yellow armchair beside a tall window with sheer curtains",
      "A dark desk with a chrome lamp and a kettle, under a wall-mounted television",
    ],
    credit("hotel_room", "Hotel Room", GREG),
  ),
  room(
    "twin-room",
    "Room",
    [{ kind: "single", count: 2 }],
    -160,
    [
      "Two single beds with white linen and red bolsters, with bird prints on the wall above",
      "A window seat with patterned cushions looking onto a green garden",
      "A small fireplace with a mantel, beside a television cabinet and a tea tray",
    ],
    credit("lythwood_room", "Lythwood Room", GREG),
  ),
  room(
    "ship-cabin",
    "Room",
    [{ kind: "single", count: 1 }],
    -175,
    [
      "A narrow cabin bed with a gold cushion and a wall lamp",
      "A compact desk and wardrobe in light wood, with a small television",
      "The cabin bed seen from the other side, under a padded wall panel",
    ],
    credit("cabin", "Cabin", GREG),
  ),
  room(
    "bright-studio",
    "Studio",
    [{ kind: "double", count: 1 }],
    -15,
    [
      "A low bed with a rust-coloured throw in a white panelled studio, beside a wide window",
      "A long window with a white lattice sill, looking over trees",
      "A small white kitchen with a retro fridge, open shelves and a wooden counter",
    ],
    credit("brown_photostudio_04", "Brown Photostudio 04", SERGEJ),
  ),
  room(
    "green-loft",
    "House",
    LIVING_ROOM,
    -70,
    [
      "A green leather armchair and a dark writing desk against a deep green wall",
      "A blue armchair under a tall window in a brick-walled room",
      "A window with brass ornaments on the sill, set in a green wall",
    ],
    credit("photo_studio_loft_hall", "Photo Studio Loft Hall", SERGEJ),
  ),
  room(
    "country-lounge",
    "House",
    LIVING_ROOM,
    -135,
    [
      "Cream sofas around a low table on a patterned rug, under a chandelier",
      "A long lounge with armchairs and sofas facing a wall of garden windows",
      "Sofas and a wood-burning stove beside tall windows",
    ],
    credit("lythwood_lounge", "Lythwood Lounge", GREG),
  ),
  room(
    "garden-lounge",
    "House",
    LIVING_ROOM,
    140,
    [
      "A dark green corner sofa under a landscape painting, around a glass coffee table",
      "Green armchairs in front of a bay window with patterned curtains",
      "A dark wooden sideboard with a vase of flowers beside the window",
    ],
    credit("anniversary_lounge", "Anniversary Lounge", GREG),
  ),
  room(
    "parlour",
    "House",
    LIVING_ROOM,
    -75,
    [
      "A cream buttoned sofa under two landscape paintings, against floral wallpaper",
      "A tall arched window with white frames",
      "White double doors opening onto further rooms, with an armchair beside them",
    ],
    credit("combination_room", "Combination Room", SERGEJ),
  ),
  room(
    "timber-lounge",
    "House",
    LIVING_ROOM,
    -22,
    [
      "A large brown corner sofa in a timber-lined lounge with a slatted ceiling",
      "A stone chimney wall with a television, beside two small yellow windows",
      "A pool table in a timber-lined room, with a dark sofa behind it",
    ],
    credit("wooden_lounge", "Wooden Lounge", GREG),
  ),
  room(
    "mountain-flat",
    "Studio",
    [{ kind: "sofa bed", count: 1 }],
    -10,
    [
      "A sofa bed beside sliding doors that open onto a balcony facing a mountain",
      "A long sofa bed under a window with blinds",
      "A breakfast bar with three woven bar stools in front of a wooden kitchen",
    ],
    credit("kiara_interior", "Kiara Interior", GREG),
  ),
  room(
    "lake-house",
    "House",
    LIVING_ROOM,
    -140,
    [
      "A dark wooden dining table with a lounge and open kitchen behind it",
      "A balcony seen through an open door, looking over water at dusk",
      "The dining table beside glass doors that open onto a garden",
    ],
    credit("cayley_interior", "Cayley Interior", GREG),
  ),
  room(
    "bath-loft",
    "House",
    LIVING_ROOM,
    -60,
    [
      "A grey armchair among pink and blue flowers below an arched window",
      "A white roll-top bath on clawed feet beside a small round table",
      "A buttoned velvet sofa against a dark grey panelled wall",
    ],
    credit("brown_photostudio_06", "Brown Photostudio 06", SERGEJ),
  ),
  room(
    "library-lounge",
    "House",
    LIVING_ROOM,
    -20,
    [
      "Floor-to-ceiling bookshelves behind a dark leather chesterfield sofa",
      "A carved fireplace hung with Christmas stockings between bookshelves",
      "A blue armchair and a lit Christmas tree beside a wooden ladder",
    ],
    credit("christmas_photo_studio_01", "Christmas Photo Studio 01", SERGEJ),
  ),
  room(
    "festive-studio",
    "Studio",
    [{ kind: "double", count: 1 }],
    -160,
    [
      "A double bed with grey linen by tall windows, on a black and white patterned rug",
      "A set table and a pink buttoned armchair in front of a window",
      "A white fireplace with a Christmas wreath, a lit tree and a white sofa",
    ],
    credit("christmas_photo_studio_05", "Christmas Photo Studio 05", SERGEJ),
  ),
  room(
    "fireside-lounge",
    "House",
    LIVING_ROOM,
    0,
    [
      "A wood fire glowing in a dark hearth beside a short flight of stairs",
      "A deep olive sofa with a soft throw against a gold curtain",
      "A long sofa under a painting of a red sunset",
    ],
    credit("fireplace", "Fireplace", GREG),
  ),
  room(
    "drawing-room",
    "House",
    LIVING_ROOM,
    110,
    [
      "A green velvet sofa in front of a wall of pink roses beside a white fireplace",
      "A corner of tall leafy plants framed by dark green curtains",
      "A pale wooden table under a bright window with sheer curtains",
    ],
    credit("photo_studio_london_hall", "Photo Studio London Hall", SERGEJ),
  ),
  room(
    "reading-lounge",
    "House",
    LIVING_ROOM,
    70,
    [
      "A navy corner sofa with patterned cushions beside a potted tree",
      "Two leather armchairs around a small table with red flowers",
      "A long sideboard with a gilt mirror, flowers and blue bottles",
    ],
    credit("reading_room", "Reading Room", GREG),
  ),
  room(
    "family-kitchen",
    "House",
    LIVING_ROOM,
    50,
    [
      "A warm wooden kitchen with an eye-level oven and a long counter",
      "A tall fridge covered in magnets beside the kitchen cupboards",
      "Evening sun through closed blinds above a kitchen counter",
    ],
    credit("blinds", "Blinds", GREG),
  ),
  room(
    "thatched-lapa",
    "House",
    LIVING_ROOM,
    120,
    [
      "A thatched lapa with white tables and chairs and a patterned sofa",
      "A low wall and a green garden seen from under the thatch",
      "A dark wooden table and a white chair beside garden plants",
    ],
    credit("lapa", "Lapa", GREG),
  ),
  room(
    "apartment-living",
    "House",
    LIVING_ROOM,
    20,
    [
      "A dining table with yellow and blue chairs by glass doors onto a balcony",
      "A pale corner sofa under a big shaded lamp",
      "A white and wood sideboard with a vase and a small sculpture",
    ],
    credit("IndoorEnvironmentHDRI001", "Indoor Environment HDRI 001", ACG_AUTHOR, "ambientCG"),
  ),
  room(
    "guest-lounge",
    "House",
    LIVING_ROOM,
    -160,
    [
      "A bright guest lounge with an upright piano and orange armchairs by tall windows",
      "Rows of cafe tables and orange chairs along a wall of windows",
      "A clock wall, a projection screen and a sofa in the lounge",
    ],
    credit("IndoorEnvironmentHDRI013", "Indoor Environment HDRI 013", ACG_AUTHOR, "ambientCG"),
  ),
];

/** Bathrooms, shown as a second tour inside a stay. Each has one picture, which opens its tour. */
const bathroom = (key: string, startYaw: number, alt: string, source: Credit): ExtraTour => ({
  label: "The bathroom",
  photo: { src: `/media/${key}-1.jpg`, alt, width: 1600, height: 1067 },
  tour: { panorama: `/media/${key}-pano.jpg`, width: 4096, startYaw },
  credit: source,
});

const BATHROOMS: Record<string, ExtraTour> = {
  "cliffside-suite": bathroom(
    "bathroom-classic",
    -60,
    "A tiled bathroom with a vanity basin and a pink bath with a hand shower",
    credit("bathroom", "Bathroom", GREG),
  ),
  "city-room": bathroom(
    "bathroom-ensuite",
    -150,
    "An en-suite with a granite basin, a mirror and a glass shower",
    credit("en_suite", "En Suite", GREG),
  ),
  "bright-studio": bathroom(
    "bathroom-modern",
    0,
    "A modern bathroom with grey tiles, a bath under a skylight and a walk-in shower",
    credit("modern_bathroom", "Modern Bathroom", "Adrian Kubasa"),
  ),
};

/** What each photograph shows. Rooms and studios show where you sleep; houses show a shared space. */
const SCENES: Record<string, string> = {
  "cliffside-suite": "the bedroom",
  "glass-house": "the whole studio",
  "city-room": "the bedroom",
  "twin-room": "the bedroom",
  "ship-cabin": "the cabin",
  "bright-studio": "the whole studio",
  "green-loft": "the study",
  "country-lounge": "the lounge",
  "garden-lounge": "the lounge",
  parlour: "the parlour",
  "timber-lounge": "the games lounge",
  "mountain-flat": "the whole studio",
  "lake-house": "the dining room",
  "bath-loft": "the living room",
  "library-lounge": "the library",
  "festive-studio": "the whole studio",
  "fireside-lounge": "the fireside lounge",
  "drawing-room": "the drawing room",
  "reading-lounge": "the lounge",
  "family-kitchen": "the kitchen",
  "thatched-lapa": "the lapa",
  "apartment-living": "the living room",
  "guest-lounge": "the guest lounge",
};

export const rooms: Room[] = photographed.map((item) => {
  const scene = SCENES[item.key];
  if (!scene) throw new Error(`No scene for room "${item.key}"`);
  return { ...item, scene, bathroom: BATHROOMS[item.key] };
});

export const bathrooms: ExtraTour[] = Object.values(BATHROOMS);

export const roomByKey = new Map(rooms.map((item) => [item.key, item]));

/** The home page pictures. They are not stays, so they are credited separately. */
export const heroCredit: Credit = credit("illovo_beach_balcony", "Illovo Beach Balcony", GREG);

export const assetPage = (source: Credit): string =>
  source.source === "ambientCG" ? `https://ambientcg.com/view?id=${source.asset}` : `https://polyhaven.com/a/${source.asset}`;
