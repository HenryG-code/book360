import Link from "next/link";
import { BookingsCount } from "@/components/BookingsCount";
import { Mark, Wordmark } from "@/components/Mark";
import { MobileMenu, type MenuLink } from "@/components/MobileMenu";
import { SectionLink } from "@/components/SectionLink";
import { SurpriseButton } from "@/components/SurpriseButton";

// The "floating island": every link sits in one rounded, frosted bar in the centre of the header, and
// "Book a room" is the bar's filled middle, so booking is both central and the boldest thing there.
//
// The header is a three-column grid with equal outer columns, so the island stays centred on the page
// whatever the logo on the left and the button on the right measure. It spans the full width of the
// screen, so the logo and the surprise button sit near the edges and the island floats between them. Over the hero photo the island is
// glass (a blur of the photo behind it); on light pages it is a white bar with a soft shadow.

const leftLinks = [
  { href: "/#idea", label: "The idea" },
  { href: "/#how", label: "How it works" },
];

/** The phone menu lists everything, with booking first. */
const menuLinks: MenuLink[] = [
  { href: "/stays", label: "Book a room" },
  ...leftLinks,
  { href: "/hosts", label: "For hosts" },
  { href: "/bookings", label: "My bookings" },
];

/** `overlay` places the header on top of a dark hero image; otherwise it sits on the page background. */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const tone = overlay ? "on-dark absolute inset-x-0 top-0 z-20 text-white" : "relative bg-paper text-ink";
  const island = overlay
    ? "border-white/25 bg-white/10 shadow-black/20"
    : "border-ink/10 bg-white/85 shadow-navy-deep/10";
  const item = `flex h-11 items-center rounded-full px-4 transition-colors ${overlay ? "hover:bg-white/15" : "hover:bg-sand"}`;
  const book = overlay ? "bg-white text-navy-deep hover:bg-sand" : "bg-navy text-white hover:bg-navy-deep";

  return (
    <header className={tone}>
      <nav
        aria-label="Main"
        className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-4 sm:px-6 lg:px-10 lg:py-5 2xl:px-14"
      >
        <Link href="/" aria-label="Book360 home" className="flex items-center gap-2.5 justify-self-start py-1">
          <Mark className="size-9" />
          {/* On narrow phones only the pin shows, so the booking button keeps the centre. */}
          <Wordmark className="hidden text-[0.9375rem] min-[420px]:inline" />
        </Link>

        {/* Wide screens: the island with every link. */}
        <ul
          className={`hidden items-center gap-0.5 rounded-full border p-1.5 text-[0.8125rem] shadow-xl backdrop-blur-md lg:flex ${island}`}
        >
          {leftLinks.map((link) => (
            <li key={link.href}>
              <SectionLink href={link.href} className={item}>
                {link.label}
              </SectionLink>
            </li>
          ))}
          <li className="mx-1">
            <Link
              href="/stays"
              className={`flex h-11 items-center gap-2 rounded-full px-5 font-medium shadow-md transition-colors ${book}`}
            >
              <Mark className="size-4" />
              Book a room
            </Link>
          </li>
          <li>
            <Link href="/hosts" className={item}>
              For hosts
            </Link>
          </li>
          <li>
            <Link href="/bookings" className={item}>
              My bookings
              <BookingsCount />
            </Link>
          </li>
        </ul>

        {/* Phones and tablets: the same filled button on its own, still in the centre. */}
        <Link
          href="/stays"
          className={`flex h-11 items-center gap-2 rounded-full border px-1.5 text-[0.8125rem] font-medium shadow-lg backdrop-blur-md lg:hidden ${island}`}
        >
          <span className={`flex h-8 items-center gap-2 rounded-full px-4 ${book}`}>
            <Mark className="size-4" />
            Book a room
          </span>
        </Link>

        <div className="flex items-center justify-end gap-2">
          {/* Phones have the surprise button in their menu instead, so the booking pill keeps the centre. */}
          <span className="hidden sm:flex">
            <SurpriseButton overlay={overlay} />
          </span>
          <MobileMenu links={menuLinks} />
        </div>
      </nav>
    </header>
  );
}
