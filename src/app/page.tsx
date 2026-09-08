import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <section className="hero-field relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="glow-orb absolute -left-20 top-24 h-64 w-64 rounded-full bg-[#4f8f6a]/30 blur-3xl" />
        <div className="glow-orb absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-[#e8b84a]/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(244,240,230,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(244,240,230,0.35) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-[78vh] w-full max-w-6xl flex-col justify-center px-4 py-16 sm:px-6">
        <p className="rise-in font-[family-name:var(--font-display)] text-5xl leading-none tracking-tight text-[#f4f0e6] sm:text-7xl md:text-8xl">
          KickoffCal
        </p>
        <h1 className="rise-in-delay mt-5 max-w-2xl text-2xl font-medium leading-snug text-[#d7e6db] sm:text-3xl">
          NFL on Apple Calendar — TV, streaming, and scores that stay in iCloud.
        </h1>
        <p className="rise-in-delay mt-4 max-w-xl text-base text-[#9bc7a8]">
          One subscribed calendar per team. Toggle them in the Calendar app,
          refresh as often as every few minutes, and never dig for where the
          game is on.
        </p>
        <div className="rise-in-delay mt-8 flex flex-wrap gap-3">
          <Link
            href="/nfl"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-[#e8b84a] text-[#142018] hover:bg-[#f0c968]",
            )}
          >
            Browse NFL teams
          </Link>
          <Link
            href="/pricing"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "border-white/20 text-[#f4f0e6]",
            )}
          >
            From $2/mo
          </Link>
        </div>
      </div>
    </section>
  );
}
