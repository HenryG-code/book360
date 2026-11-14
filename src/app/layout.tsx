import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { Gloock, Inter } from "next/font/google";
import "./globals.css";

// next/font downloads the fonts at build time and serves them from this site, so visitors make no
// request to Google and the text does not jump when the font arrives.
// Gloock is a heavy, high-contrast serif made for large headings. It has one weight, which is all a
// heading font needs here. Inter does the small text.
const display = Gloock({ subsets: ["latin"], weight: "400", variable: "--font-display-face" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans-face" });

export const metadata: Metadata = {
  title: { default: "Book360", template: "%s · Book360" },
  description: "A booking demo where you look around the room before you reserve. Bookings are simulated.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">
        <p className="bg-ink px-4 py-2 text-center text-[0.6875rem] tracking-wide text-white/85">
          Demo site. Stays, prices and bookings are simulated. The photographs are real rooms, but not these stays.
        </p>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
