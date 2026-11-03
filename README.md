# StayView

A hotel and holiday-rental booking demo where guests explore a room before completing a simulated
booking. Availability and checkout are simulated throughout.

> **Status: not started.** This repository holds the plan and structure. Nothing below is implemented,
> and no claim here has been tested.

## Stack

Next.js, React, TypeScript, Tailwind CSS, Zod, Marzipano and Playwright, with seeded data and static
assets. Docker and Kubernetes are unnecessary for the first version.

## Build order

1. [Feasibility prototype](docs/feasibility.md): three seeded listings and a viewer or gallery fallback, with a separate AI experiment
2. First usable release: responsive search, listing, tour or gallery, then simulated confirmation
3. Later: offline AI asset integration, host tools, optional real backend

## Quick start

Not available yet. Commands are listed by `make help`.

## Documentation

- [Requirements](docs/requirements.md)
- [Architecture](docs/architecture.md)
- [Threat model](docs/threat-model.md)
- [Feasibility gates](docs/feasibility.md)
- [Decision records](docs/adr/)

## Limitations

Bookings saved in a browser do not reserve shared inventory. Generated room previews are not evidence
of real dimensions or amenities. This is a non-commercial portfolio demo.

## Licence

Not yet chosen. Publish only sample photos you have permission to use, and credit them here.
