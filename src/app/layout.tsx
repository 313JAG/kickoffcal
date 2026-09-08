import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/kickoff/site-chrome";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "KickoffCal — NFL calendars for Apple Calendar & iCloud",
    template: "%s · KickoffCal",
  },
  description:
    "Subscribe to live NFL team calendars in Apple Calendar with TV, streaming, scores, and watch links — one calendar per team, toggled in iCloud.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#07150f] font-sans text-[#f4f0e6]">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
