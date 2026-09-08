import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import {
  getGamesForTeam,
  getTeamBySlug,
  getTeamMap,
} from "@/lib/db/cache";
import { SubscribeButtons } from "@/components/kickoff/subscribe-buttons";
import { WhereToWatch } from "@/components/kickoff/where-to-watch";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);
  return {
    title: team ? `${team.name} calendar` : "Team calendar",
  };
}

export default async function TeamPage({ params }: Props) {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);
  if (!team) notFound();

  const [games, teamsById] = await Promise.all([
    getGamesForTeam(team.id),
    getTeamMap(),
  ]);

  const now = Date.now();
  const upcoming = games.filter((g) => new Date(g.kickoffUtc).getTime() >= now - 4 * 3600_000);
  const next = upcoming[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/nfl" className="text-sm text-[#9bc7a8] hover:text-[#e8b84a]">
        ← All NFL teams
      </Link>

      <div className="mt-6 flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-center">
        {team.logoUrl && (
          <Image
            src={team.logoUrl}
            alt=""
            width={88}
            height={88}
            className="h-20 w-20 object-contain sm:h-22 sm:w-22"
            unoptimized
          />
        )}
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[#f4f0e6] sm:text-5xl">
            {team.name}
          </h1>
          <p className="mt-2 text-[#9bc7a8]">
            {upcoming.length} upcoming games · Apple Calendar / iCloud
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-6">
        <h2 className="text-sm uppercase tracking-[0.2em] text-[#e8b84a]">
          Add to Apple Calendar
        </h2>
        <div className="mt-4">
          <SubscribeButtons feedToken={team.feedToken} teamName={team.name} />
        </div>
      </section>

      {next && (
        <section className="mt-8 rounded-2xl border border-[#e8b84a]/30 bg-[#e8b84a]/5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#e8b84a] text-[#142018]">Next game</Badge>
            {next.week ? (
              <span className="text-xs text-[#9bc7a8]">Week {next.week}</span>
            ) : null}
          </div>
          {(() => {
            const away = teamsById.get(next.awayTeamId);
            const home = teamsById.get(next.homeTeamId);
            if (!away || !home) return null;
            return (
              <>
                <h3 className="mt-3 text-2xl font-semibold text-[#f4f0e6]">
                  {away.name} @ {home.name}
                </h3>
                <p className="mt-1 text-[#d7e6db]">
                  {format(new Date(next.kickoffUtc), "EEE, MMM d · h:mm a")} UTC
                  {next.venue ? ` · ${next.venue}` : ""}
                </p>
                <div className="mt-3">
                  <WhereToWatch broadcasts={next.broadcasts} />
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  {next.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#e8b84a] underline-offset-4 hover:underline"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </>
            );
          })()}
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#f4f0e6]">
          Upcoming schedule
        </h2>
        <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
          {upcoming.length === 0 && (
            <p className="py-6 text-sm text-[#9bc7a8]">
              No upcoming games in cache yet. Trigger a sync from /api/sync.
            </p>
          )}
          {upcoming.map((game) => {
            const away = teamsById.get(game.awayTeamId);
            const home = teamsById.get(game.homeTeamId);
            if (!away || !home) return null;
            return (
              <article
                key={game.id}
                className="grid gap-3 py-5 sm:grid-cols-[140px_1fr_1fr] sm:items-start"
              >
                <div className="text-sm text-[#9bc7a8]">
                  <p className="font-medium text-[#d7e6db]">
                    {format(new Date(game.kickoffUtc), "MMM d")}
                  </p>
                  <p>{format(new Date(game.kickoffUtc), "EEE · h:mm a")}</p>
                  {game.week ? <p>Week {game.week}</p> : null}
                </div>
                <div>
                  <p className="font-medium text-[#f4f0e6]">
                    {away.abbreviation} @ {home.abbreviation}
                  </p>
                  <p className="text-sm text-[#9bc7a8]">{game.venue ?? "Venue TBD"}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {game.links.map((link) => (
                      <a
                        key={`${game.id}-${link.provider}`}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#e8b84a] hover:underline"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
                <WhereToWatch broadcasts={game.broadcasts} />
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
