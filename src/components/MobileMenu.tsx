"use client";

// The phone menu: a full-screen panel in the site's deep navy, with the links set large in the
// heading serif, numbered like the "How it works" steps, rising in one after another.
//
// It is built on the browser's own <dialog> element, opened with showModal(). That one choice gives:
//   - Escape closes it, and Back on Android does too
//   - keyboard focus stays inside the menu while it is open, and returns to the Menu button after
//   - everything behind it is inert: it cannot be clicked, tabbed to or read out by a screen reader
// The page behind is also kept from scrolling while the menu is open.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Mark, Wordmark } from "@/components/Mark";
import { SectionLink } from "@/components/SectionLink";

export type MenuLink = { href: string; label: string };

export function MobileMenu({ links }: { links: MenuLink[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  // Keep the page behind still while the menu is open.
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const show = () => {
    dialogRef.current?.showModal();
    setOpen(true);
  };
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label="Menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="-mr-3 flex h-11 items-center gap-2.5 px-3 text-[0.8125rem] lg:hidden"
      >
        <span aria-hidden="true" className="flex w-5 flex-col gap-[5px]">
          <span className="h-px bg-current" />
          <span className="h-px w-3 self-end bg-current" />
        </span>
        {/* On the narrowest phones only the icon shows, so the header's centre stays centred. */}
        <span className="hidden min-[400px]:inline">Menu</span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Menu"
        onClose={() => setOpen(false)}
        // A click on the backdrop area outside the content closes it, like tapping away from a sheet.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="mobile-menu on-dark m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-navy-deep p-0 text-white"
      >
        {/* A very large, faint copy of the mark, as in the footer. Decoration only. */}
        <Mark className="pointer-events-none absolute -bottom-24 -right-28 size-[28rem] text-white/[0.05]" />

        <div className="relative flex h-full flex-col px-6 pb-8 pt-5">
          <div className="flex items-center justify-between">
            <Link href="/" onClick={close} aria-label="Book360 home" className="flex items-center gap-2.5 py-1">
              <Mark className="size-9" />
              <Wordmark className="text-[0.9375rem]" />
            </Link>
            <button type="button" onClick={close} className="-mr-3 flex h-11 items-center gap-2.5 px-3 text-[0.8125rem]">
              <span aria-hidden="true" className="relative block size-4">
                <span className="absolute inset-x-0 top-1/2 h-px rotate-45 bg-current" />
                <span className="absolute inset-x-0 top-1/2 h-px -rotate-45 bg-current" />
              </span>
              Close
            </button>
          </div>

          {/* Sizes follow the screen height (svh), so all five links fit on a short phone without scrolling. */}
          <nav aria-label="Menu" className="mt-[min(3rem,5svh)] flex-1 overflow-y-auto">
            <ul className="border-t border-white/15">
              {links.map((link, index) => (
                <li
                  key={link.href}
                  className="mobile-menu-item border-b border-white/15"
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <SectionLink href={link.href} onClick={close} className="group flex items-baseline gap-5 py-[min(1.25rem,2svh)]">
                    <span aria-hidden="true" className="eyebrow w-6 text-white/45">
                      0{index + 1}
                    </span>
                    <span className="display text-[min(2.4rem,6svh)] transition-opacity group-hover:opacity-75">{link.label}</span>
                  </SectionLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mobile-menu-item mt-[min(2rem,3svh)]" style={{ "--i": links.length } as React.CSSProperties}>
            {/* Side by side, so they take one line of height on short phones. */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/stays"
                onClick={close}
                className="eyebrow flex h-12 items-center justify-center bg-white text-center text-navy-deep transition-opacity hover:opacity-90"
              >
                Browse every stay
              </Link>
              <Link
                href="/stays/surprise"
                prefetch={false}
                onClick={close}
                className="eyebrow flex h-12 items-center justify-center border border-white/40 text-center text-white transition-colors hover:bg-white/10"
              >
                Surprise me
              </Link>
            </div>
            <p className="mt-6 text-center text-xs text-white/55">
              Want one like this?{" "}
              <a href="mailto:hello@weblytics.co.za?subject=Book360" className="text-white underline underline-offset-4">
                hello@weblytics.co.za
              </a>
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}
