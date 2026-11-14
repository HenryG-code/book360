import Link from "next/link";
import { Mark, Wordmark } from "@/components/Mark";

const links = [
  { href: "/#idea", label: "The idea" },
  { href: "/#stays", label: "Stays" },
  { href: "/#how", label: "How it works" },
  { href: "/#questions", label: "Questions" },
];

/** `overlay` places the header on top of a dark hero image; otherwise it sits on the page background. */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const tone = overlay
    ? "on-dark absolute inset-x-0 top-0 z-20 border-white/25 text-white"
    : "relative border-sand-deep bg-paper text-ink";
  return (
    <header className={`border-b ${tone}`}>
      <nav aria-label="Main" className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5 lg:px-10">
        <Link href="/" aria-label="Book360 home" className="flex items-center gap-2.5 py-1">
          <Mark className="size-9" />
          <Wordmark className="text-[0.9375rem]" />
        </Link>
        {/* Wide screens show the links in a row. Phones get the menu further down instead. */}
        <ul className="hidden items-center gap-9 text-[0.8125rem] lg:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="opacity-85 transition-opacity hover:opacity-100">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/#stays" className="hidden items-center gap-2.5 py-3 text-[0.8125rem] lg:flex">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
          Find a stay
        </Link>
        {/*
          The phone menu. <details> is the browser's own open-and-close element, so the menu works
          without any JavaScript. The panel is positioned under the header, across the full width.
        */}
        <details className="group lg:hidden">
          <summary className="-mr-3 flex h-11 cursor-pointer items-center gap-2.5 px-3 text-[0.8125rem]">
            <span aria-hidden="true" className="flex w-5 flex-col gap-[5px]">
              <span className="h-px bg-current transition-transform group-open:translate-y-[3px] group-open:rotate-45" />
              <span className="h-px bg-current transition-transform group-open:-translate-y-[3px] group-open:-rotate-45" />
            </span>
            Menu
          </summary>
          <ul className="absolute inset-x-0 top-full z-30 border-b border-sand-deep bg-paper px-6 py-3 text-ink shadow-xl shadow-navy-deep/10">
            {links.map((link) => (
              <li key={link.href} className="border-b border-ink/10 last:border-0">
                <Link href={link.href} className="block py-4 text-base">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </nav>
    </header>
  );
}
