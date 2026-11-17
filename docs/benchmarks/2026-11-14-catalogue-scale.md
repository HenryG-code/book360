# Catalogue scale check (2026-11-14)

Does the site still work when the catalogue is far larger than it needs to be today? A lab check on the
development desktop. It tests the data layer and page rendering, not a real network or real traffic.

## Setup

| Item | Value |
|---|---|
| Commit | Uncommitted work on `feat/catalogue-and-booking` |
| Hardware class | Desktop PC |
| Software | Node 24.15.0, Next.js 16.4.6 (Turbopack), production build |
| Data | Generated stays sharing 13 photographed rooms. No database |
| Network | `localhost`, so timings exclude any real connection |
| Runs | Data layer: median of 25. Page requests: one each |

Commands:

```bash
npm run bench
npm run build
BOOK360_CATALOGUE_SIZE=200000 npx next start --port 3231
```

## Data layer alone

| Stays | Build | Memory | Lookup by address | Search, no filter | Search, 3 filters | Search, sorted by price |
|---|---|---|---|---|---|---|
| 2,400 | 48 ms | 5 MB | under 0.01 ms | 0.02 ms | 0.02 ms | 0.23 ms |
| 50,000 | 102 ms | 37 MB | under 0.01 ms | 0.44 ms | 0.31 ms | 10.28 ms |
| 200,000 | 396 ms | 145 MB | under 0.01 ms | 2.45 ms | 2.13 ms | 39.32 ms |

## Full pages, with 200,000 stays

| Request | Time | Size |
|---|---|---|
| Search, first request after start | 624 ms | 100 KB |
| Search, again | 29 ms | 100 KB |
| Search with three filters, sorted by price | 30 ms | 101 KB |
| Search, last page (8,334) | 25 ms | 56 KB |
| A generated stay, first visit | 61 ms | 51 KB |
| The same stay, second visit | 6 ms | 51 KB |
| Home page | 13 ms | 82 KB |

The production build took about 13 seconds and produced the same 15 pages at every catalogue size,
because only the three featured stays are built ahead of time.

## What this shows

- **Looking a stay up does not slow down.** It uses a `Map`, which takes the same time at any size.
- **Search slows in step with the catalogue**, because it reads every stay. It is still 2 ms at 200,000.
- **Sorting is the first thing to hurt:** 39 ms at 200,000, because it reorders every match.
- **Page size does not grow.** A search page is about 100 KB whether there are 2,400 stays or 200,000.
- **Build time does not grow**, and a stay page is fast after its first visit.

## What this does not show

- **No concurrency.** One request at a time. Many visitors at once were not simulated.
- **No real network, no real phone.**
- **No database.** The catalogue is in memory. A real one would be slower per query and would need
  indexes to stay fast. This is the largest gap between this check and a real system.
- **Thirteen photographs.** Real stays each have their own, so image storage and delivery at scale are
  untested.
- **The first request after a start is slow** (624 ms) while the catalogue is built and code is loaded.
  On hosting that starts servers on demand, some visitors would feel that.

## Still to do

1. Repeat with many requests at once and record the slowest ones, not only the median.
2. Repeat on the real hosting plan after a preview deployment.
3. Repeat against a database once one exists.
