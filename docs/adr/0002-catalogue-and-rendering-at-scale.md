# 0002: Catalogue and page rendering at scale

- **Status:** Accepted
- **Date:** 2026-11-14

## Problem

The prototype had three hand-written stays in one file, and every page was built ahead of time. The
goal is a site that could hold thousands of stays. Three things break if nothing changes:

- Pages read the list directly, so swapping the list for a database later means editing every page.
- Building every stay page ahead of time makes each deploy slower as the catalogue grows.
- A page that lists "all stays" grows without limit.

## Options

1. **Keep the list, add more by hand.** Honest, but tells us nothing about scale.
2. **Add a database now.** The real answer eventually, but it brings hosting, cost, migrations and
   security before we know the site's shape, and it breaks the "static first" plan for the first release.
3. **Put a repository interface in front of generated data.** Pages ask a `ListingRepository` for stays.
   Today it is filled by a deterministic generator; later a database implementation replaces it.

For rendering:

- **A. Build every stay page ahead of time.** Fastest pages, but build time grows with the catalogue.
- **B. Render every stay page on every request.** No build cost, but every visit pays for rendering.
- **C. Build the featured stays ahead of time, and each other stay on its first visit, then keep it.**

## Decision

Option 3 with rendering C.

- `src/catalogue/types.ts` defines `ListingRepository`. Its methods return promises, because a database
  answers later, not at once. Pages never touch the data behind it.
- `src/catalogue/generate.ts` builds the catalogue from a seeded recipe, so stay number 1,804 is the
  same stay on every machine and after every restart. Its address can therefore be shared.
- A stay (invented: name, place, price) points at a room (real: one photograph). Thirteen rooms serve
  thousands of stays, and every page says so.
- Search returns one page of 24 stays. Filters live in the address and are checked before use.
- Stay pages use `generateStaticParams` for the featured three and `dynamicParams = true` for the rest.

Evidence, from [the scale check](../benchmarks/2026-11-14-catalogue-scale.md): at 200,000 stays a
search took about 2 ms in the data layer and about 30 ms as a full page; a stay page took 61 ms on its
first visit and 6 ms after; the build took the same 13 seconds as with 2,400.

## Consequences

**Easier:** adding stays costs nothing at build time. A database can replace the generator behind one
interface. Search pages can be shared and reloaded.

**Harder:** search reads every stay on each request. That is fine into the tens of thousands, and at
200,000 a price sort already costs 39 ms. The catalogue also lives in the server's memory (145 MB at
200,000), once per server.

**What would change this:** real hosts adding real stays. Then the data must be shared and durable,
which means a database with indexes on region, type, price and guests, and search moves into SQL. Text
search beyond simple matching would need a search index. Neither changes a page, only the repository.
