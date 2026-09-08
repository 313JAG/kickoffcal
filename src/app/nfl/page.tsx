import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllTeams, getNflCache } from "@/lib/db/cache";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "NFL calendars",
};

export const dynamic = "force-dynamic";

export default async function NflIndexPage() {
  const [teams, cache] = await Promise.all([getAllTeams(), getNflCache()]);

  const grouped = teams.reduce<Record<string, typeof teams>>((acc, team) => {
    const key = team.conference ?? "NFL";
    acc[key] ??= [];
    acc[key].push(team);
    return acc;
  }, {});

  for (const key of Object.keys(grouped)) {
    grouped[key].sort(
      (a, b) =>
        (a.division ?? "").localeCompare(b.division ?? "") ||
        a.name.localeCompare(b.name),
    );
  }

  const conferenceOrder = ["AFC", "NFC"];
  const conferences = [
    ...conferenceOrder.filter((c) => grouped[c]?.length),
    ...Object.keys(grouped).filter((c) => !conferenceOrder.includes(c)),
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-[#e8b84a]">2026 season</p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[#f4f0e6] sm:text-5xl">
          NFL team calendars
        </h1>
        <p className="max-w-2xl text-[#9bc7a8]">
          Pick a team, add it to Apple Calendar once, and toggle it in iCloud
          whenever you want. Flex moves and watch info stay current.
          {cache.games.length > 0 && (
            <>
              {" "}
              {cache.games.length} games synced · updated{" "}
              {new Date(cache.syncedAt).toLocaleString()}.
            </>
          )}
        </p>
      </div>

      <div className="mt-10 space-y-12">
        {conferences.map((conference) => (
          <section key={conference}>
            <h2 className="mb-4 text-sm uppercase tracking-[0.2em] text-[#9bc7a8]">
              {conference}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[conference].map((team) => (
                <Link
                  key={team.id}
                  href={`/nfl/${team.slug}`}
                  className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#e8b84a]/50 hover:bg-white/[0.06]"
                >
                  {team.logoUrl ? (
                    <Image
                      src={team.logoUrl}
                      alt=""
                      width={48}
                      height={48}
                      className="h-12 w-12 object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#143324] text-sm font-semibold">
                      {team.abbreviation}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[#f4f0e6] group-hover:text-white">
                      {team.name}
                    </p>
                    <p className="text-xs text-[#9bc7a8]">
                      {team.division ?? team.abbreviation}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-[#143324] text-[#d7e6db]">
                    Subscribe
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
