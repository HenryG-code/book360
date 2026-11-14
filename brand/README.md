# Brand

| File | What it is |
|---|---|
| [logo-template.svg](logo-template.svg) | The working file: mark, horizontal and stacked logos, a dark version, an app icon and the colours, on one sheet |
| [mark.svg](mark.svg) | The mark alone, ready to drop into other tools |

## The idea

A map pin standing inside a ring that passes behind and in front of it. The pin is the place you stay,
and the ring is looking all the way around it. The wordmark sets BOOK in the text colour and 360 in
blue, in capitals with wide spacing.

## Editing

SVG is a text format for drawings, so the template opens two ways:

- **In a design tool.** Figma, Inkscape, Affinity and Illustrator all open it. Each logo is a named
  group (`logo-horizontal`, `logo-stacked`, `logo-on-dark`, `app-icon`), so it can be selected and
  exported on its own.
- **In a text editor.** The colours are four plain hex values, so find and replace changes one everywhere. The mark is three
  shapes inside `<symbol id="mark">`, and every logo on the sheet reuses that symbol, so one edit
  changes them all.

The wordmark is live text set in Inter Medium. exactly. Convert the text to outlines before sending a file to a printer, so it does not depend on the
font being installed there.

## Where the app uses it

| Place | File |
|---|---|
| Header, footer, home page badges | `src/components/Mark.tsx` |
| Browser tab icon | `src/app/icon.svg` |

These hold copies of the three shapes. After changing the mark in the template, copy the shapes into
both files.

## Rules of thumb

- Keep clear space around the logo of at least the width of the pin.
- Use navy or ink on light backgrounds and white on dark ones. On dark, set 360 in the lighter blue
  (#8CC0EC); the normal blue is too dim there. Do not place it on a busy photograph
  without a dark wash behind it.
- Do not stretch it, outline it or add effects.
