import type { Metadata } from "next";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Page not found" };

// Shown for any address that does not exist, including a stay that has been removed. A dead end loses
// the visitor, so this page gives them the three most likely ways back in, with the site's own header
// and footer around it. Next.js still answers with the HTTP status 404, so search engines drop the
// address.
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="relative overflow-hidden bg-sand px-6 py-24 text-center sm:py-32">
        <Mark className="pointer-events-none absolute -right-24 -top-16 size-[26rem] text-navy/[0.06]" />
        <p className="eyebrow relative text-stone">404 · Page not found</p>
        <h1 className="display relative mx-auto mt-6 max-w-3xl text-5xl sm:text-7xl">This Room Isn&apos;t Here</h1>
        <p className="relative mx-auto mt-8 max-w-md text-[0.9375rem] leading-relaxed text-stone">
          The address may be mistyped, or the stay may have been taken off the site. Every other room is still
          here to look around.
        </p>
        <div className="relative mx-auto mt-12 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/stays" className="eyebrow flex h-12 items-center justify-center bg-navy px-8 text-white hover:bg-navy-deep">
            Browse every stay
          </Link>
          <Link
            href="/stays/surprise"
            prefetch={false}
            className="eyebrow flex h-12 items-center justify-center border border-ink/20 px-8 hover:bg-white"
          >
            Surprise me
          </Link>
        </div>
        <p className="relative mt-10">
          <Link href="/" className="text-link">
            Back to the home page
          </Link>
        </p>
      </main>
    </>
  );
}
