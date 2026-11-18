# Changelog

Notable changes are recorded here, following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- The same photograph appeared on many stays. The site now shows one stay per real 360° photograph: 23
  stays, none sharing a picture. Ten more rooms were added from Poly Haven and ambientCG, and three bathrooms
  appear as a second tour inside the stays they suit.
- "How it works" and "The idea" did nothing when clicked a second time, because the address already
  ended in that section. They now scroll to their section every time.
- On phones the menu stayed open over the section it had just jumped to. It now closes.

### Added

- A full-width header with a floating, frosted island of links in the centre, "Book a room" as its filled
  middle, and a turning "surprise me" button that opens a random stay.
- Tabs on a stay page when it has more than one 360° tour.
- A header built around booking: a "Book a room" button in the centre of every page, links either side, and a
  count beside "My bookings". On phones, a full-screen menu in the site's navy and serif style.
- Playwright tests for every link to a home-page section, the phone menu, the header and a crawl of the
  whole site for broken links, missing sections, failed requests and script errors.
- Home page FAQ rewritten for owners and backers, with a contact button.
- Guest numbers now follow the beds. Every photographed room lists the beds it shows; a stay sleeps
  exactly what its beds hold, and its price per guest stays inside a band for its type. Stay pages show
  the beds and bedrooms, and houses say their tour shows the living room.
- A scroll-driven intro: a Blender animation of the Book360 pin plays as the home page scrolls, with the
  words "Look Around First, Decide After" arriving one by one. Built from a script, with the `.blend`
  working file in `brand/intro/`. A still image replaces it when reduced motion is requested.
- Deployed to https://book360.vercel.app through Vercel's GitHub integration.
- Browser tests can run against a deployed site with `BASE_URL`, and a script times a live deployment.
- A catalogue of 2,400 stays behind a repository interface: three hand-written, the rest generated from
  a seeded recipe to test the site at scale. Ten more real 360° photographs, thirteen rooms in total.
- A search page with filters, sorting and paging. Filters live in the address.
- Stay pages for every stay, built on first visit and then kept.
- A working demo booking flow: dates, guests, a price checked by the server, a reference, a "My
  bookings" page, cancelling and an "Add to calendar" file.
- The business model: a 3% commission on the room charge, shown in the booking breakdown and on a new
  page for hosts with a payout calculator.
- Booking rules as pure functions in `src/domain/`, with unit tests run by Node's built-in test runner.
- Scroll-linked effects in CSS only: a reading progress line, drifting photographs and a draggable
  panorama strip.
- Decision records 0002 (catalogue and rendering at scale) and 0003 (booking and commission), an
  integrations document and a catalogue scale benchmark.

- Dependabot configuration: weekly update pull requests for npm packages and GitHub Actions.
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
