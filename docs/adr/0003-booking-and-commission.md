# 0003: Booking flow and the 3% commission

- **Status:** Accepted
- **Date:** 2026-11-14

## Problem

The booking page was a placeholder. The site needs a booking flow that works end to end, and a
business model. There is still no account system, no payment provider and no shared database, and
adding all three now would be most of a company. What can be made real, and what must stay simulated?

## Options

1. **Browser only.** Dates, price and confirmation all in the browser. Simple, but the price is whatever
   the browser says it is, which teaches the wrong habit.
2. **Full backend.** Accounts, payments, a bookings table. Correct, and far ahead of this stage.
3. **Server checks, browser remembers.** The server calculates the price and validates the dates; the
   browser stores the confirmed booking.

For the business model: a guest service fee, a host subscription, or a commission on each booking.

## Decision

Option 3, with a 3% commission taken from the host's side.

**The rules are pure functions** in `src/domain/`: dates, pricing and availability. They import nothing
from React or Next.js, so they run in the browser, on the server and in unit tests unchanged.

**The server is the authority on price.** The browser sends the stay, the dates and the guest count,
never an amount. `POST /api/bookings` looks the stay up and calls the same `quoteStay` function itself.
A test sends a made-up total of one cent and checks it is ignored.

**Money is whole cents.** The commission rate is written as 300 basis points, so the rate is a whole
number too. A unit test checks that the host's share and Book360's share always add back up to what the
guest paid.

**The model:**

| | |
|---|---|
| Guest pays | nights x nightly rate + cleaning fee |
| Book360 keeps | 3% of nights x nightly rate |
| Host receives | the rest |

The commission is on the room charge only, and comes out of the host's side, so the guest sees no fee
added at checkout.

**Dates are nights, not days**, written as `[checkIn, checkOut)`. Leaving on the day another guest
arrives is not a clash.

## Consequences

**Real today:** the whole flow, the price check, validation, a reference number, a list of bookings,
cancelling, and a calendar file.

**Simulated today, and said so on the page:**

- **No booking is stored on the server.** It lives in one browser. Nothing is held against another guest.
- **Availability is a made-up pattern** worked out from the stay's number and the week.
- **No payment is taken**, so the 3% is a calculation, not income.

**What a real backend must add.** Checking availability in code is not enough: two guests can check at
the same moment and both be told the night is free. The database itself must refuse the second booking.
In PostgreSQL that is an exclusion constraint on the stay and the date range. For money, a marketplace
payment provider takes the 3% as an application fee and pays the host the rest; that provider's
processing charge then has to come out of someone's share, which is not modelled here.

**What would change this:** at 3% the margin is thin. Card processing commonly costs around that much,
so the model needs either the host to carry processing, or volume. That is a business question to
answer with real numbers before any real money moves.
