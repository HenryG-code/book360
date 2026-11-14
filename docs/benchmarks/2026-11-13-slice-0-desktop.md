# Slice 0, desktop lab check (2026-11-13)

A first look at the feasibility prototype on the development desktop. **This does not pass any
feasibility gate.** The gates need a real phone and a preview deployment, and neither was used here.

There were two runs on the same day. Run 1 used computer-drawn placeholder images. Run 2 replaced them
with real 360-degree photographs, listed in [CREDITS.md](../../CREDITS.md).

## Setup

| Item | Value |
|---|---|
| Commit | Uncommitted work on `feat/slice-0-feasibility-prototype`, based on `6771f4f` |
| Hardware class | Desktop PC with a discrete GPU |
| Browser | Chromium-based, desktop, 1280x800 and an emulated 375x812 viewport |
| Network | `localhost`, so timings say nothing about a real connection |
| Software | Node 24.15.0, Next.js 16.4.6 (Turbopack), React 19.3.1, Marzipano 0.10.2, Tailwind CSS 4.3.5 |
| Media, run 1 | Computer-drawn placeholder images, since removed |
| Media, run 2 | Real photographs from Poly Haven (CC0), prepared by `scripts/prepare-media.mjs` |
| Runs | One of each |

Commands for run 2:

```bash
npm run media:prepare
npm run build
npm run start -- --port 3211
```

## Results, run 1 (placeholder images)

| Check | Result |
|---|---|
| Stay page before the tour is opened | No viewer chunk and no panorama requested (production build) |
| After clicking "Open 360° tour" | Two new downloads: viewer chunk 49 KB gzipped (190 KB unpacked), panorama 159 KB |
| Tour interaction | Drag, on-screen arrow buttons and arrow keys all turn the view. Escape and "Close tour" exit |
| WebGL forced off with `?webgl=off` | Tour replaced by a message linking to the photos. "Reserve" still reachable |
| Booking placeholder | Reachable from the stay page without the viewer loading |
| 375 px wide viewport | No horizontal scrolling on the home page |
| Total sample media | 708 KB for 11 files |

In the development server (`npm run dev`) the viewer chunk is fetched before the click. That is
development behaviour; the production build is what the first two rows describe.

## Results, run 2 (real photographs)

Each panorama is 4096 x 2048 pixels, saved as a progressive JPEG at quality 80.

| Stay | Panorama | Three gallery photos |
|---|---|---|
| Cliffside Suite | 517 KB | 351 KB |
| Glass House | 1,019 KB | 615 KB |
| City Room | 445 KB | 209 KB |

| Check | Result |
|---|---|
| Stay page before the tour is opened | No viewer chunk and no panorama requested, on all three stays |
| After clicking "Open 360° tour" | Viewer chunk (190 KB unpacked, served from the browser cache in this run) and that stay's panorama |
| Tour | Opens on all three stays, facing the same way as the first gallery photo |
| WebGL forced off with `?webgl=off` | Message shown, no viewer or panorama requested, photos load, "Reserve" still reachable |
| Narrow viewport | No horizontal scrolling on the stay pages |
| Metadata | Published files carry no EXIF, location or colour profile data |
| Total media | 3,493 KB for 13 files |

**What changed from the guess in run 1.** Run 1 expected a real photograph at this size to be several
megabytes. Measured, the three are between 445 KB and 1,019 KB. The size depends on the picture: the
Glass House has fine detail everywhere (window frames, scrub, a patterned rug) and is twice the size of
the plainer rooms. Three photographs are a small sample, so treat 1 MB as the figure to plan around,
not as a limit.

## What this does not show

- **Sharpness was not judged.** 4096 pixels around a full circle is about 11 pixels per degree. Whether
  that looks sharp enough on a large screen, or whether a bigger file is worth its weight, is a decision
  for ADR 0001.
- **WebGL was simulated off, not really off.** The flag skips the check in our code. A browser with
  WebGL truly disabled still has to be tried.
- **No phone was used.** Load time, smoothness and memory on a real mobile device are unmeasured.
- **The "tour ready" time on the page** stops when the scene is created, which may be slightly before
  the first frame is drawn.
- **Nothing is deployed**, so hosting limits are unchecked.

## Still to do for the gates

1. ~~Replace the placeholder with a permitted 360-degree photo and record its size.~~ Done in run 2.
2. Open the tour on a real phone and record load time, transferred bytes and smoothness.
3. Turn WebGL off in a browser's settings and repeat the fallback check.
4. Ask one other person whether the provenance labels are clear.
5. Deploy a preview and compare the files with the hosting plan's limits.
