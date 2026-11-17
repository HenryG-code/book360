# Live deployment check (2026-11-17)

The first check of Book360 on real hosting, after the catalogue of 2,400 stays was deployed. It answers
two questions: does everything that passed on the development desktop still work on Vercel, and how
fast is it from where the owner is?

## Setup

| Item | Value |
|---|---|
| Commit | `a4fc5e4` on `main`, deployed by Vercel's GitHub integration |
| Address | https://book360.vercel.app |
| Hosting | Vercel, function region `iad1` (Washington, D.C., the default). Static files from the nearest edge |
| Client | The development desktop in South Africa, on a home connection. Requests reached Vercel's Cape Town edge (`cpt1`) |
| Catalogue | 2,400 stays, the default |
| Runs | 15 per request type, then 100 search requests with 10 at a time |

Commands:

```bash
npm run bench:live -- https://book360.vercel.app
BASE_URL=https://book360.vercel.app npx playwright test
```

## Does it work?

All 89 browser tests that apply passed against the live site, at desktop, phone and narrow phone sizes
(7 phone-only tests skip on desktop, as they do locally). Every page returned 200, an unknown stay
returned 404, and the booking server ignored a made-up total of one cent and charged the real amount.

On the first run three desktop tests timed out at 5 seconds. Re-run a minute later, all three passed in
about a second. They were the first requests to touch a panorama and a generated stay after the
deployment, so they waited for cold starts (see below). Live runs now allow 15 seconds per check.

## How fast is it?

Time to first byte, measured from the desktop:

| Request | Median | Slowest of 15 | Served from | Cache |
|---|---|---|---|---|
| Home (built ahead) | 47 ms | 107 ms | Cape Town edge | Hit |
| Featured stay (built ahead) | 68 ms | 232 ms | Cape Town edge | Hit |
| Generated stay (built on first visit) | 50 ms | 1,354 ms | Cape Town edge, built in `iad1` | Hit |
| Search, no filter | 319 ms | 724 ms | `iad1` | Miss |
| Search, 3 filters, sorted | 302 ms | 580 ms | `iad1` | Miss |
| Search, last page | 303 ms | 382 ms | `iad1` | Miss |
| Booking price check | 311 ms | 857 ms | `iad1` | Miss |

Search with 10 requests at a time, 100 in total: 5.9 s overall, median 328 ms, 95th percentile 794 ms,
slowest 1,517 ms, no failures.

The booking check answered 409 ("already booked") in this run because the dates it chose fell in a
simulated taken week. It still measures the full server path.

## What this shows

- **Pages built ahead are fast everywhere.** They come from the nearest edge, about 50 ms here.
- **Anything the server works out costs a trip to Washington.** Search was 2 ms on the desktop; here it
  is about 300 ms, and nearly all of that is distance. The code is not the slow part.
- **A generated stay is slow once, then fast.** Its first visit took 1.35 s while the page was built;
  every visit after that came from the edge cache in about 50 ms.
- **Cold starts are real.** The first panorama requested after the deployment took 5.9 s; once cached
  at the edge, panoramas took 0.5 to 0.9 s. A panorama nobody had asked for yet took 0.7 to 1.6 s.
- **Ten requests at a time did not break anything**, but the slowest ones roughly doubled.

## What this does not show

- **One location.** A visitor in Europe or the United States would see different numbers: closer to
  `iad1`, possibly further from an edge copy.
- **No real phone.** The phone tests ran in a desktop browser pretending to be a phone, on a home
  connection. Slice 0's phone gate is still open.
- **Light load only.** Ten at a time is a handful of visitors, not a traffic spike.
- **Hosting limits not compared.** Slice 0's fourth gate asks for the panorama sizes to be compared
  with the hosting plan's current static-file and bandwidth limits. That needs the plan's terms read
  from Vercel, which this check did not do.

## Candidate next step

Moving the function region from `iad1` to Cape Town (`cpt1`) should take most of the 300 ms out of
search and booking for visitors in South Africa, and add it for visitors elsewhere. It is a single
setting, so it belongs in a decision record before it changes.
