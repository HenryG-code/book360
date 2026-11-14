# Changelog

Notable changes are recorded here, following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project structure and planning documentation.
- Feasibility prototype: three hard-coded stays, a 360° tour that loads Marzipano only after a click, a
  photo fallback when WebGL is unavailable, and a placeholder booking page.
- Real 360° photographs from Poly Haven (CC0) for all three stays and the home page, each stay with its
  own tour. A script resizes them and cuts the gallery photos from the same photographs.
- Renamed the project from StayView to Book360.
- A logo: a map pin inside an orbit ring, with a BOOK360 wordmark, an editable working file in `brand/`
  and a browser tab icon.
- Phone layout work: a no-JavaScript menu, a Reserve bar that stays on screen on stay pages, 44-pixel
  touch targets, a two-line hero headline at 360 pixels, and tests that run at a narrow phone size.
- "What you get" rebuilt as a grid of cards showing the unwrapped panorama, a gallery picture, real
  figures and real keys, in place of the icon list.
- Redesigned every page: Gloock headings, a deeper sea-blue palette, a home page built from alternating
  text and photograph bands, a fuller stay page, a questions section and a new footer.
- Playwright end-to-end tests at desktop and phone sizes, and a script that captures every page for
  visual review.
- `CREDITS.md` and a photo credits page recording the source, author and licence of every picture.
- Design tokens for the visual direction: sand, ocean blue, serif headings.
