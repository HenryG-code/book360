# Architecture

Planned design, not yet implemented.

## Application

A Next.js site deployed on Vercel. Seeded typed JSON supplies properties, room types, amenities,
date-based sample pricing and tour metadata. Favourites and demo bookings stay in browser storage.

## Pages

Search and results, listing details, room tour, date and guest selection, price review, confirmation.
Search filters live in the URL.

## Data rules

Money in integer minor units with a currency. Accommodation nights as date-only values in half-open
ranges `[checkIn, checkOut)`.

## Tour component

Load the viewer dynamically when opened, showing a lightweight poster first. Provide keyboard-accessible
hotspots and a conventional gallery fallback. WebGL failure never blocks booking.

Real 360-degree panoramas are the reliable first experience. Flat photos support a guided gallery,
and do not become accurate panoramas automatically.

## Tour provenance

Each tour has a manifest of source photos, capture permission, generation method, tool and model
version, generation date, known gaps and review status. Original captures stay separate from inferred content.

## Media delivery

Serve finished media as static assets or from a direct storage path. Vercel Functions have a 4.5 MB
payload limit, so large files must not pass through them. Static assets still have their own deployment
and transfer limits, so validate a real exported scene against the current plan first.

## Deployment

Pull requests run lint, type checks, unit tests, build and Playwright. Vercel creates previews with Git
Fork Protection enabled and no sensitive variables. Merging to the production branch deploys. Roll back
by restoring a known-good deployment, and record the asset version with the application version.

## Optional later backend

One application and PostgreSQL, with authenticated server operations and server-calculated prices. A
single rental rejects overlapping dates with an exclusion constraint. Hotel room types need per-night
capacity accounting. Review hosting terms and costs first.
