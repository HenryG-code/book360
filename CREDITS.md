# Media credits

Every image in `public/media/` is made from one of the photographs below. Nothing is generated.

All fourteen are 360-degree photographs published by [Poly Haven](https://polyhaven.com) under
[CC0 1.0](https://polyhaven.com/license), a public domain dedication. CC0 allows copying, changing and
republishing without permission or credit. They are credited here anyway, so the origin of every
picture can be checked.

| Used for | Asset | Author | Source file checksum (md5) |
|---|---|---|---|
| Cliffside Suite: tour and photos | [Relax Inn Seaview Suite](https://polyhaven.com/a/relax_inn_seaview_suite) | Dario Barresi (photography), Jenelle van Heerden (processing) | `2f5bdca6a5234d8e66ad1bff803a9626` |
| Glass House: tour and photos, and one wide home page picture | [Glasshouse Interior](https://polyhaven.com/a/glasshouse_interior) | Dario Barresi | `f9bfc47f33ddccbb803baae3db3e0d80` |
| City Room: tour and photos | [Hotel Room](https://polyhaven.com/a/hotel_room) | Greg Zaal | `5675e838ff32b9ca8ac8ac4635d3adaf` |
| Generated test stays (Room) | [Lythwood Room](https://polyhaven.com/a/lythwood_room) | Greg Zaal | `004ed677597376a17b4642f4d6e61883` |
| Generated test stays (Room) | [Cabin](https://polyhaven.com/a/cabin) | Greg Zaal | `d21a0880f656bb81ceea99c879f45ccb` |
| Generated test stays (Studio) | [Brown Photostudio 04](https://polyhaven.com/a/brown_photostudio_04) | Sergej Majboroda | `c19bff53bec5c5352d0ea5c8f022d1af` |
| Generated test stays (Studio) | [Photo Studio Loft Hall](https://polyhaven.com/a/photo_studio_loft_hall) | Sergej Majboroda | `3456280ca1b1cb80ebe14f257bca296d` |
| Generated test stays (House) | [Lythwood Lounge](https://polyhaven.com/a/lythwood_lounge) | Greg Zaal | `482855e7c9d03b260f3ff26c115ad774` |
| Generated test stays (House) | [Anniversary Lounge](https://polyhaven.com/a/anniversary_lounge) | Greg Zaal | `3df39e24797865650d33278341d77847` |
| Generated test stays (House) | [Combination Room](https://polyhaven.com/a/combination_room) | Sergej Majboroda | `2b279b4ca8ffe85a4851c35d81c8aa7d` |
| Generated test stays (House) | [Wooden Lounge](https://polyhaven.com/a/wooden_lounge) | Greg Zaal | `ebcf0bdbabe9ec013091caa4c1535601` |
| Generated test stays (Studio) | [Kiara Interior](https://polyhaven.com/a/kiara_interior) | Greg Zaal | `17df3e469b1bfb8e4ef4c29d32bd53aa` |
| Generated test stays (House) | [Cayley Interior](https://polyhaven.com/a/cayley_interior) | Greg Zaal | `b56ae551991b3cd259cd11f23e4129b5` |
| Two home page pictures | [Illovo Beach Balcony](https://polyhaven.com/a/illovo_beach_balcony) | Greg Zaal | `842bcd05fe9a8f929f3a9608144cd48e` |

Source file: the "Tonemapped JPG" download of each asset, 8192 x 4096 pixels, fetched on 2026-11-13.

## What was changed

`scripts/prepare-media.mjs` makes every published file from those sources:

- Each panorama is resized to 4096 x 2048 pixels.
- Each gallery photo and the home page picture is a flat view cut out of the 360-degree photograph.
- Embedded metadata is removed. The published files carry no EXIF, location or colour profile data.

Nothing is added, removed or retouched inside a picture.

The ten "generated test stays" photographs were fetched on 2026-11-14. Every photograph is shared by
many generated stays, and the first three are also used by generated stays of the same type.

## What the pictures do not mean

The stays on the site are invented. Their names, places and prices are made up, and they are not the
places in the photographs. No photographer, business or place shown is connected to this project or
endorses it.

## Adding media

Add a file only when its licence or written permission is recorded in this document first.
