"use client";

// A link to a section of the home page, such as "/#how", that works every time.
//
// Two bugs it fixes:
//   1. A plain link to "/#how" did nothing when the address already ended in "#how". The browser (and
//      Next.js) saw no change of address, so nothing scrolled, and a visitor who had scrolled away and
//      clicked "How it works" again stayed where they were.
//   2. Inside the phone menu, tapping a link to a section of the same page left the menu open on top of
//      the section it had just scrolled to.
//
// So when the visitor is already on the page the link points to, this scrolls to the section itself,
// every time, and puts the section's address in the history so Back still works. On any other page it
// is an ordinary link. Either way, a menu it sits in is closed.

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = Omit<React.ComponentProps<typeof Link>, "href"> & { href: string };

export function SectionLink({ href, onClick, ...rest }: Props) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        // Close the phone menu this link sits in, if any.
        event.currentTarget.closest("details")?.removeAttribute("open");

        const [path, id] = href.split("#");
        if (!id || (path || "/") !== pathname) return; // another page: let the link navigate as usual
        const target = document.getElementById(id);
        if (!target) return;

        event.preventDefault();
        const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
        if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
        // Move keyboard focus to the section too, so the next Tab continues from there.
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }}
    />
  );
}
