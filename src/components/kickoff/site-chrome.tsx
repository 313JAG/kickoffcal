import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-white/10 bg-[#07150f]/70 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[#f4f0e6] sm:text-3xl">
            KickoffCal
          </span>
          <span className="hidden text-xs uppercase tracking-[0.2em] text-[#9bc7a8] sm:inline">
            for Apple Calendar
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-[#d7e6db]">
          <Link href="/nfl" className="transition hover:text-white">
            NFL
          </Link>
          <Link href="/account" className="transition hover:text-white">
            Account
          </Link>
          <Link
            href="/pricing"
            className="rounded-md bg-[#e8b84a] px-3 py-1.5 font-medium text-[#142018] transition hover:bg-[#f0c968]"
          >
            Pricing
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#07150f] py-8 text-[#9bc7a8]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} KickoffCal — made for Apple Calendar &
          iCloud.
        </p>
        <p className="text-xs text-[#7aa389]">
          Set subscription refresh to 5–15 minutes for nearer-live scores.
        </p>
      </div>
    </footer>
  );
}
