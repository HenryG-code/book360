// Calendar files.
//
// An .ics file is the format every calendar app understands (Google, Apple, Outlook). Producing one is
// the simplest real integration there is: no account, no key, no other company's server. The same
// format is how booking sites share availability with each other, so this is a first step towards that.

import type { DateOnly } from "./dates.ts";

const compact = (date: DateOnly): string => date.replaceAll("-", "");

/** Commas, semicolons, backslashes and line breaks have special meaning in the format, so they are escaped. */
const escapeText = (text: string): string => text.replace(/([\\;,])/g, "\\$1").replace(/\r?\n/g, "\\n");

export type CalendarStay = { reference: string; name: string; location: string; checkIn: DateOnly; checkOut: DateOnly };

/** One all-day event from check-in to check-out. `stamp` is when the file was made, e.g. 20270301T120000Z. */
export function stayToIcs(stay: CalendarStay, stamp: string): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Book360//Demo//EN",
    "BEGIN:VEVENT",
    `UID:${stay.reference}@book360.demo`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(stay.checkIn)}`,
    // For all-day events the end date is the first day NOT included, which is exactly the check-out day.
    `DTEND;VALUE=DATE:${compact(stay.checkOut)}`,
    `SUMMARY:${escapeText(`Stay at ${stay.name}`)}`,
    `LOCATION:${escapeText(stay.location)}`,
    `DESCRIPTION:${escapeText(`Book360 demo booking ${stay.reference}. No real room is reserved.`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
