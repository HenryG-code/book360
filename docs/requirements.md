# Requirements

## User and problem

Guests want to know what a room is really like before booking. The demo shows a complete booking
flow with honest room previews.

## Essential journeys (first release)

1. Search and filter listings, then share or refresh the URL without losing filters
2. Open a listing and review its details, photos and fees
3. Explore a room tour, or use the gallery when the tour fails
4. Select dates and guests, then review the price
5. Complete simulated checkout and see a confirmation matching the reviewed total

## Scope stages

| Stage | Includes |
|---|---|
| Feasibility prototype | Three seeded listings and a viewer or gallery fallback, plus a separate AI experiment |
| First usable release | Responsive search, listing, tour or gallery, and simulated confirmation |
| Later scope | Successful offline AI asset integration, host tools, optional real backend |

**Excluded:** real payments, shared inventory, generation during web requests, automatic reconstruction from sparse photos as an MVP promise.

## Invariants

- A visitor can finish the whole flow without loading the 3D viewer.
- Every fee appears before confirmation, and the confirmation matches the reviewed total.
- Simulated features are labelled, and demo bookings never claim to reserve inventory.
- Generated content is labelled, with original photos available for comparison.

## Non-functional requirements

- No tour bundle or full panorama on the initial results page, with poster-first loading.
- Target p75 LCP of 2.5 seconds or less on a documented mobile profile. This is unmeasured, and a single lab run is not field p75.
- Keyboard-accessible controls, including hotspots, with reduced-motion support and a mobile layout.

## Acceptance tests

- [ ] Filters survive refresh and navigation
- [ ] Date validation handles same-day checkout boundaries correctly
- [ ] Every displayed fee appears before confirmation, and the confirmation matches the reviewed total
- [ ] The entire flow completes without loading the 3D viewer
- [ ] The tour has loading, failure, exit, keyboard and mobile states
- [ ] Original images and AI-preview labels remain discoverable in the room-tour section
- [ ] Demo booking state is clearly local to the browser
