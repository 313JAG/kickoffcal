import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
};

export default function PricingPage() {
  const stripeLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[#f4f0e6]">
        Pricing
      </h1>
      <p className="mt-2 text-[#9bc7a8]">
        Team calendars are free for Apple Calendar while we prove the PoC.
        KickoffCal Pro unlocks preference-synced feeds and future multi-team
        bundles.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#9bc7a8]">Free</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">$0</p>
          <ul className="mt-4 space-y-2 text-sm text-[#d7e6db]">
            <li>All 32 NFL team calendars for Apple / iCloud</li>
            <li>TV + streaming in every event</li>
            <li>ESPN + Apple Sports links</li>
          </ul>
          <Link
            href="/nfl"
            className={cn(buttonVariants({ variant: "secondary" }), "mt-6 inline-flex w-full")}
          >
            Browse NFL
          </Link>
        </div>

        <div className="rounded-2xl border border-[#e8b84a]/40 bg-[#e8b84a]/10 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#e8b84a]">Pro</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">
            $2<span className="text-base font-sans text-[#9bc7a8]">/mo</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[#d7e6db]">
            <li>Emoji + score preference sync</li>
            <li>Guidance for 5–15 min Apple refresh</li>
            <li>Multi-team iCloud bundle (soon)</li>
          </ul>
          {stripeLink ? (
            <a
              href={stripeLink}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants(),
                "mt-6 inline-flex w-full bg-[#e8b84a] text-[#142018] hover:bg-[#f0c968]",
              )}
            >
              Subscribe with Stripe
            </a>
          ) : (
            <span
              className={cn(
                buttonVariants(),
                "mt-6 inline-flex w-full cursor-not-allowed bg-[#e8b84a]/50 text-[#142018] opacity-80",
              )}
            >
              Add NEXT_PUBLIC_STRIPE_PAYMENT_LINK
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
