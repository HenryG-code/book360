# Book360

A hotel and holiday-rental booking demo where guests explore a room before completing a simulated
booking. Availability and checkout are simulated throughout.

> **Status: feasibility prototype in progress.** A prototype runs locally with real 360° photographs. No
> feasibility gate has passed yet, and nothing is deployed.

## Stack

Next.js, React, TypeScript, Tailwind CSS, Zod, Marzipano and Playwright, with seeded data and static
assets. Docker and Kubernetes are unnecessary for the first version.

## Build order

1. [Feasibility prototype](docs/feasibility.md): three seeded listings and a viewer or gallery fallback, with a separate AI experiment
2. First usable release: responsive search, listing, tour or gallery, then simulated confirmation
3. Later: offline AI asset integration, host tools, optional real backend

**Live demo:** https://book360.vercel.app. Deployed by Vercel from `main` on every merge.

## Quick start

Needs Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. Add `?webgl=off` to a stay's address to see the tour fallback.
`npm run media:prepare -- --fetch` downloads the source photographs (about 103 MB, kept out of git) and
rebuilds the web-sized images. The built images are already in `public/media/`, so this is optional.

Tests need one extra download the first time, the browser that Playwright drives:

```bash
npx playwright install chromium
npm run test:e2e
```

`npm run qa:screens -- http://localhost:3000` saves a picture of every page, at desktop and phone sizes,
into `test-results/screens/` while the dev server is running.

Rebuilding the intro animation needs Blender 5.2. It takes about 8 minutes:

```bash
"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --factory-startup -P brand/intro/build_intro.py -- --render all
npm run media:intro
```

Other checks:

```bash
npm run test:unit
npm run bench
npm test
```

`BASE_URL=https://book360.vercel.app npx playwright test` runs the browser tests against the live site
instead of a local one, and `npm run bench:live -- https://book360.vercel.app` times it.

`test:unit` runs the booking rules in under a second. `bench` times the catalogue code at 2,400, 50,000 and
200,000 stays. Those large catalogues exist only for the benchmark and reuse photographs; the site
itself shows one stay per real photograph. `npm test` runs the type check, the unit tests and the browser tests in order.

Versions in use: Next.js 16.4.6, React 19.3.1, Tailwind CSS 4.3.5, Marzipano 0.10.2, TypeScript 5.9, Playwright 1.65.0.

## Documentation

- [Requirements](docs/requirements.md)
- [Architecture](docs/architecture.md)
- [Threat model](docs/threat-model.md)
- [Feasibility gates](docs/feasibility.md)
- [Build plan](docs/build-plan.md): the order of work, one tested slice at a time
- [Decision records](docs/adr/)

## Limitations

Bookings saved in a browser do not reserve shared inventory. Generated room previews are not evidence
of real dimensions or amenities. This is a non-commercial portfolio demo.

## Licence

The code is licensed under the [Apache License 2.0](LICENSE).

Every image in `public/media/` comes from a photograph released under CC0 by Poly Haven. Sources and
authors are in [CREDITS.md](CREDITS.md). The stays themselves are invented. Add a picture only after its
licence or permission is recorded there.
