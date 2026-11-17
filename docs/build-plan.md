# Build plan

Everything here is **planned**. A slice becomes fact only when its tests pass and its row in the
progress table is ticked. [Requirements](requirements.md) say what must be true,
[architecture](architecture.md) says how, and this document says in what order.

## How to use this plan

Build one slice at a time, each on its own short-lived branch and pull request. Do not start a slice
until the one before it is merged.

Starting prompt for a working session:

```text
Read docs/build-plan.md, docs/requirements.md and docs/architecture.md.
We are on slice <N>: <name>. Build only that slice.
Explain each decision and why, before writing the code for it.
Write the tests listed for the slice, and run them.
Update docs/architecture.md, the progress table in docs/build-plan.md and CHANGELOG.md in the same change.
Write an ADR for any decision the slice says to record.
Stop when the slice's "done when" list is met, and tell me what to try by hand.
```

## Decisions to make before slice 1

| Decision | Recommendation | Record in |
|---|---|---|
| Tour format | Real 360-degree panoramas in Marzipano, with a gallery fallback | ADR 0001, after slice 0 |
| Rendering | Next.js App Router. Listings rendered on the server from seeded data, booking state in the browser | ADR 0002 |
| Sample media | Only files whose licence and permission are recorded in a credits file | `CREDITS.md` |
| Licence | Choose before the first push | `LICENSE` |

The AI reconstruction experiment is separate. Nothing in slices 0 to 8 depends on it.

## Slice 0: feasibility prototype

**Goal:** prove the tour loads acceptably on a phone and that the booking flow survives without it.

**Build:** a bare Next.js page with three hard-coded listings, one panorama loaded in Marzipano only
after a click, and a plain photo gallery shown when WebGL is unavailable.

**Checks:**

1. Open the tour on a real mobile device and record load time, transferred bytes and whether panning
   is smooth.
2. Disable WebGL and confirm the gallery appears and booking is still reachable.
3. Show the source photos beside the tour with a provenance label, and ask one other person whether
   they can tell what is original and what is generated or simulated.
4. Deploy a preview and compare the panorama's file size with the hosting plan's current static-file and
   bandwidth limits.

**Done when:** the four website gates in [feasibility](feasibility.md) are ticked with a result file in
`docs/benchmarks/`, and ADR 0001 records the tour format and the image sizes chosen.

## Slice 1: skeleton and CI

**Goal:** an empty site that builds, tests and deploys the same way every time.

**Build:**

- Next.js with strict TypeScript, Tailwind CSS, ESLint, Vitest in `tests/unit/` and Playwright in
  `tests/e2e/`. A committed lock file.
- Layout, navigation, a visible "demo, bookings are simulated" notice, and base design tokens: spacing,
  type scale, colours, focus ring.
- `make dev-local` and `make test` implemented.
- `.github/workflows/ci.yml`: locked install, lint, type check, unit tests, build, Playwright. Read-only
  token, actions pinned to commit SHAs.

**Done when:** CI is green on a pull request and a preview deployment loads.

## Slice 2: domain library

**Goal:** all booking rules as pure, tested functions before any page uses them.

**Build in `src/domain/`:**

- **Money:** integer minor units with a currency. One formatting function.
- **Dates:** date-only strings, half-open ranges `[checkIn, checkOut)`, night count, validation that
  check-out is after check-in.
- **Pricing:** nightly rates by date, cleaning fee, service fee and tax, returning an itemised
  breakdown and a total. The confirmation page reuses this one function.
- **Availability:** a simulated calendar derived from seed data.
- **Schemas:** Zod schemas for listings, tour manifests and search parameters.

**Tests:** same-day and one-night boundaries, month and year ends, rates that change mid-stay, rounding,
invalid search parameters.

**Done when:** acceptance test 2 passes as unit tests, and the domain folder imports nothing from React
or Next.js.

## Slice 3: search and results

**Goal:** search, filter, and share the URL.

**Build:** typed seed data for at least three properties. A results page with filters for location,
dates, guests, price range and amenities. Every filter lives in the URL and is parsed with Zod. Empty
and invalid-filter states. No tour code or panorama is loaded on this page.

**Tests:** Playwright: set filters, reload, go back and forward, and open the copied URL in a new context.

**Done when:** acceptance test 1 passes, and the results page's network log shows no tour bundle.

## Slice 4: listing details

**Goal:** everything a guest needs before choosing dates.

**Build:** property details, room types, amenities, an accessible photo gallery, and all fees shown
before any booking step. Responsive images with explicit dimensions.

**Tests:** Playwright for the listing page on mobile and desktop viewports, plus an automated
accessibility scan.

**Done when:** journey 2 in the requirements works on a phone-sized viewport.

## Slice 5: room tour

**Goal:** the tour, with every failure handled.

**Build:**

- A poster image first. The viewer loads through a dynamic import only when the visitor opens it.
- Hotspots as real buttons: focusable, labelled, and usable with the keyboard.
- Loading, failure, exit and reduced-motion states. WebGL failure shows the gallery.
- A provenance manifest per tour, validated by the Zod schema, and an "about this tour" panel showing
  source photos, capture permission and review status.

**Tests:** Playwright for open, navigate by keyboard, exit, and a simulated WebGL failure.

**Done when:** acceptance tests 5 and 6 pass.

## Slice 6: booking flow

**Goal:** dates to confirmation, clearly simulated.

**Build:** date and guest selection, a price review page using the slice 2 pricing function, simulated
checkout, and a confirmation saved in browser storage. Favourites in browser storage. Storage access is
wrapped so a blocked or empty store never breaks a page. Every booking screen says the booking is a
demo held only in this browser.

**Tests:** Playwright for the full journey, an assertion that the confirmation total equals the reviewed
total, and a run with browser storage disabled.

**Done when:** acceptance tests 3, 4 and 7 pass, and all five journeys work end to end.

## Slice 7: accessibility and performance

**Goal:** measured quality, not assumed quality.

**Build:** keyboard walk-through of every journey, a screen reader spot check, contrast fixes, and
performance budgets enforced in CI for the results and listing pages.

**Evidence:** a benchmark report with the device profile, network profile, number of runs and the
results. State clearly that these are lab measurements.

**Done when:** the report is in `docs/benchmarks/` and the budgets run on every pull request.

## Slice 8: first release

**Build:** README with screenshots and a quick start, a media credits file, the EXIF and location
review from the threat model, an inspection of the client bundle for secrets, changelog and tag `v0.1.0`.

**Done when:** every acceptance test in the requirements passes in CI, and the pre-publish checklist is
complete.

## Later scope, one piece at a time

| Slice | Adds | Evidence required |
|---|---|---|
| 9 | AI reconstruction experiment for one permitted room, offline | Quality, frame rate, download size and GPU needs compared with the panorama |
| 10 | AI preview integrated, only if slice 9 meets its threshold | Labels and original photos discoverable |
| 11 | Host capture guide and asset review workflow | |
| 12 | Real booking backend with PostgreSQL | Overlapping-booking tests, hosting terms and cost reviewed |

## Progress

**Order changed on 2026-11-14.** At the owner's request, parts of slices 2, 3 and 6 were built before
slice 0's gates were run, to test whether the design scales. Slice 0 is still open: its four gates need
a real phone, a real WebGL-off browser, another person's view of the labels and a preview deployment.

| Slice | Status | Evidence |
|---|---|---|
| 0 Feasibility prototype | In progress: prototype built, gates not yet run | [Desktop lab check](benchmarks/2026-11-13-slice-0-desktop.md) |
| 1 Skeleton and CI | Not started. Playwright and its first tests were added early, during slice 0, at the owner's request | |
| 2 Domain library | Started early: dates, pricing, commission and availability with unit tests. Zod schemas not done | `tests/unit/` |
| 3 Search and results | Started early: search, filters in the address, paging over 2,400 generated stays. Date filter not done | [Scale check](benchmarks/2026-11-14-catalogue-scale.md) |
| 4 Listing details | Not started | |
| 5 Room tour | Not started | |
| 6 Booking flow | Started early: demo flow with a server price check. Favourites and storage-disabled run not done | [ADR 0003](adr/0003-booking-and-commission.md) |
| 7 Accessibility and performance | Not started | |
| 8 First release | Not started | |
