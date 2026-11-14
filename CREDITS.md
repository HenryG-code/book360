# Media credits

Every image in `public/media/` is made from one of the photographs below. Nothing is generated.

All four are 360-degree photographs published by [Poly Haven](https://polyhaven.com) under
[CC0 1.0](https://polyhaven.com/license), a public domain dedication. CC0 allows copying, changing and
republishing without permission or credit. They are credited here anyway, so the origin of every
picture can be checked.

| Used for | Asset | Author | Source file checksum (md5) |
|---|---|---|---|
| Cliffside Suite: tour and photos | [Relax Inn Seaview Suite](https://polyhaven.com/a/relax_inn_seaview_suite) | Dario Barresi (photography), Jenelle van Heerden (processing) | `2f5bdca6a5234d8e66ad1bff803a9626` |
| Glass House: tour and photos, and one wide home page picture | [Glasshouse Interior](https://polyhaven.com/a/glasshouse_interior) | Dario Barresi | `f9bfc47f33ddccbb803baae3db3e0d80` |
| City Room: tour and photos | [Hotel Room](https://polyhaven.com/a/hotel_room) | Greg Zaal | `5675e838ff32b9ca8ac8ac4635d3adaf` |
| Two home page pictures | [Illovo Beach Balcony](https://polyhaven.com/a/illovo_beach_balcony) | Greg Zaal | `842bcd05fe9a8f929f3a9608144cd48e` |

Source file: the "Tonemapped JPG" download of each asset, 8192 x 4096 pixels, fetched on 2026-11-13.

## What was changed

`scripts/prepare-media.mjs` makes every published file from those sources:

- Each panorama is resized to 4096 x 2048 pixels.
- Each gallery photo and the home page picture is a flat view cut out of the 360-degree photograph.
- Embedded metadata is removed. The published files carry no EXIF, location or colour profile data.

Nothing is added, removed or retouched inside a picture.

## What the pictures do not mean

The stays on the site are invented. Their names, places and prices are made up, and they are not the
places in the photographs. No photographer, business or place shown is connected to this project or
endorses it.

## Adding media

Add a file only when its licence or written permission is recorded in this document first.
