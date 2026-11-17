# Integrations

Where Book360 would connect to other services, what exists today, and where each one plugs in.

Only the first row is built. The rest are plans, listed so the code is shaped to receive them.

| Integration | Status | What it does | Where it plugs in |
|---|---|---|---|
| Calendar file (.ics) | **Built** | "Add to calendar" on a booking downloads a file every calendar app reads | `src/domain/calendar.ts` |
| Payments | Planned | Charges the guest, keeps 3% as the platform fee, pays the host the rest | `POST /api/bookings`, after the price check |
| Bookings database | Planned | Stores bookings and refuses two for the same night | A second `ListingRepository`, and a bookings table |
| Calendar sync with other sites | Planned | Imports a host's calendar from other booking sites so nights are not double-sold | `src/domain/availability.ts` |
| Email | Planned | Confirmation and reminder messages | After a booking is stored |
| Maps | Planned | Shows a stay's area on a map | Stay page, loaded on request like the tour |
| Accounts | Planned | Lets a guest see bookings on any device, and a host manage stays | Replaces browser storage in `src/lib/bookings.ts` |

## How integrations are kept from spreading

Each outside service gets one file that the rest of the code calls. The booking route would call
`payments.charge(...)`, not a provider's library directly. Three reasons:

- **Swapping.** Changing provider means rewriting one file.
- **Testing.** Tests use a fake version, so they never call a real service or move real money.
- **Secrets.** Keys are read in one place, on the server only, and never reach the browser.

The catalogue already works this way: pages call `ListingRepository`, and only one file knows the data
is generated.

## Before any of these is built

- **Payments need a legal and tax review first.** Holding or routing other people's money is regulated.
- **Secrets go in environment variables**, never in the repository. See `SECURITY.md`.
- **Every integration is optional at runtime.** If maps or email is down, booking still works, the same
  way booking already works without the 360° viewer.
