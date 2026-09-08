import { createHash } from "crypto";
import type {
  BroadcastMarket,
  BroadcastOutlet,
  BroadcastType,
  ExternalLink,
  Game,
  GameStatus,
  LeagueSlug,
  SportsProvider,
  Team,
} from "./types";
import { NFL_DIVISIONS } from "./nfl-divisions";

const ESPN_SITE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function stableToken(prefix: string, seed: string): string {
  const hash = createHash("sha256").update(seed).digest("hex").slice(0, 10);
  return `${prefix}-${hash}`;
}

function mapStatus(state?: string, completed?: boolean): GameStatus {
  if (completed || state === "post") return "final";
  if (state === "in") return "in_progress";
  if (state === "pre") return "scheduled";
  return "unknown";
}

function mapBroadcastType(shortName?: string): BroadcastType {
  const value = (shortName ?? "").toLowerCase();
  if (value.includes("stream")) return "streaming";
  if (value.includes("radio")) return "radio";
  if (value.includes("tv") || value === "") return "tv";
  return "other";
}

function mapMarket(type?: string): BroadcastMarket {
  const value = (type ?? "").toLowerCase();
  if (value === "national") return "national";
  if (value === "home") return "home";
  if (value === "away") return "away";
  if (value === "local") return "local";
  return "unknown";
}

function parseBroadcasts(competition: Record<string, unknown>): BroadcastOutlet[] {
  const outlets: BroadcastOutlet[] = [];
  const seen = new Set<string>();

  const geo = (competition.geoBroadcasts as Array<Record<string, unknown>>) ?? [];
  for (const item of geo) {
    const media = item.media as Record<string, string> | undefined;
    const market = item.market as Record<string, string> | undefined;
    const type = item.type as Record<string, string> | undefined;
    const name = media?.shortName?.trim();
    if (!name) continue;
    const outlet: BroadcastOutlet = {
      name,
      type: mapBroadcastType(type?.shortName),
      market: mapMarket(market?.type),
      region: (item.region as string | undefined) ?? undefined,
    };
    const key = `${outlet.name}|${outlet.type}|${outlet.market}`;
    if (seen.has(key)) continue;
    seen.add(key);
    outlets.push(outlet);
  }

  if (outlets.length === 0) {
    const broadcasts = (competition.broadcasts as Array<Record<string, unknown>>) ?? [];
    for (const item of broadcasts) {
      const names = (item.names as string[]) ?? [];
      for (const name of names) {
        const outlet: BroadcastOutlet = {
          name,
          type: "tv",
          market: mapMarket(item.market as string | undefined),
        };
        const key = `${outlet.name}|${outlet.type}|${outlet.market}`;
        if (seen.has(key)) continue;
        seen.add(key);
        outlets.push(outlet);
      }
    }
  }

  return outlets;
}

function appleSportsLink(teamSlug?: string): ExternalLink {
  const url = teamSlug
    ? `https://sports.apple.com/us/league/nfl/league-pass?q=${encodeURIComponent(teamSlug)}`
    : "https://sports.apple.com/us/league/nfl";
  return {
    provider: "apple_sports",
    label: "Apple Sports",
    url,
  };
}

function parseEvent(
  event: Record<string, unknown>,
  teamIdByEspn: Map<string, string>,
): Game | null {
  const competitions = event.competitions as Array<Record<string, unknown>> | undefined;
  const competition = competitions?.[0];
  if (!competition) return null;

  const competitors = (competition.competitors as Array<Record<string, unknown>>) ?? [];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  const homeEspnId = String((home?.team as Record<string, unknown>)?.id ?? "");
  const awayEspnId = String((away?.team as Record<string, unknown>)?.id ?? "");
  const homeTeamId = teamIdByEspn.get(homeEspnId);
  const awayTeamId = teamIdByEspn.get(awayEspnId);
  if (!homeTeamId || !awayTeamId) return null;

  const statusBlock = competition.status as Record<string, unknown> | undefined;
  const statusType = statusBlock?.type as Record<string, unknown> | undefined;
  const venue = competition.venue as Record<string, unknown> | undefined;
  const season = event.season as Record<string, unknown> | undefined;
  const week = event.week as Record<string, unknown> | undefined;

  const links: ExternalLink[] = [];
  const eventLinks = (event.links as Array<Record<string, unknown>>) ?? [];
  const gamecast = eventLinks.find((l) =>
    Array.isArray(l.rel) ? (l.rel as string[]).includes("summary") : false,
  );
  if (gamecast?.href) {
    links.push({
      provider: "espn",
      label: "ESPN Gamecast",
      url: String(gamecast.href),
    });
  }
  links.push(appleSportsLink());

  const espnEventId = String(event.id);
  const homeScore =
    home?.score !== undefined && home.score !== ""
      ? Number(home.score)
      : undefined;
  const awayScore =
    away?.score !== undefined && away.score !== ""
      ? Number(away.score)
      : undefined;

  return {
    id: `nfl-espn-${espnEventId}`,
    league: "nfl",
    season: Number(season?.year ?? new Date().getUTCFullYear()),
    seasonType: Number(season?.type ?? 2),
    week: week?.number !== undefined ? Number(week.number) : undefined,
    kickoffUtc: String(competition.date ?? event.date),
    homeTeamId,
    awayTeamId,
    venue: venue?.fullName ? String(venue.fullName) : undefined,
    status: mapStatus(
      statusType?.state as string | undefined,
      Boolean(statusType?.completed),
    ),
    statusDetail: statusType?.shortDetail
      ? String(statusType.shortDetail)
      : statusType?.detail
        ? String(statusType.detail)
        : undefined,
    homeScore: Number.isFinite(homeScore) ? homeScore : undefined,
    awayScore: Number.isFinite(awayScore) ? awayScore : undefined,
    broadcasts: parseBroadcasts(competition),
    links,
    providerIds: { espn: espnEventId },
    sequence: 1,
    lastSyncedAt: new Date().toISOString(),
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      // ESPN blocks many browser-like User-Agents from datacenter IPs.
      "User-Agent": "KickoffCal/0.1",
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`ESPN request failed ${res.status} for ${url}`);
  }
  return res.json() as Promise<T>;
}

export class EspnProvider implements SportsProvider {
  readonly id = "espn";
  private teamsCache: Team[] | null = null;

  async listTeams(league: LeagueSlug): Promise<Team[]> {
    if (league !== "nfl") return [];
    if (this.teamsCache) return this.teamsCache;

    const data = await fetchJson<{
      sports: Array<{
        leagues: Array<{
          teams: Array<{ team: Record<string, unknown> }>;
        }>;
      }>;
    }>(`${ESPN_SITE}/teams?limit=50`);

    const rawTeams =
      data.sports?.[0]?.leagues?.[0]?.teams?.map((entry) => entry.team) ?? [];

    this.teamsCache = rawTeams.map((team) => {
      const espnId = String(team.id);
      const location = String(team.location ?? "");
      const nickname = String(team.name ?? "");
      const displayName = String(team.displayName ?? `${location} ${nickname}`);
      const abbreviation = String(team.abbreviation ?? "");
      const slug = slugify(String(team.slug ?? displayName));
      const logos = (team.logos as Array<{ href?: string }>) ?? [];
      const divisionInfo = NFL_DIVISIONS[abbreviation];

      return {
        id: `nfl-${espnId}`,
        league: "nfl" as const,
        slug,
        name: displayName,
        abbreviation,
        location,
        nickname,
        logoUrl: logos[0]?.href ?? "",
        conference: divisionInfo?.conference,
        division: divisionInfo?.division,
        providerIds: { espn: espnId },
        feedToken: stableToken("nfl", `team-${espnId}`),
      };
    });

    return this.teamsCache;
  }

  private async teamIdMap(): Promise<Map<string, string>> {
    const teams = await this.listTeams("nfl");
    return new Map(teams.map((t) => [t.providerIds.espn, t.id] as const));
  }

  async getScoreboard(
    league: LeagueSlug,
    opts?: { season?: number; week?: number; seasonType?: number },
  ): Promise<Game[]> {
    if (league !== "nfl") return [];
    const teamIdByEspn = await this.teamIdMap();

    const season = opts?.season ?? new Date().getUTCFullYear();
    const seasonType = opts?.seasonType ?? 2;
    const params = new URLSearchParams({
      dates: String(season),
      seasontype: String(seasonType),
    });
    if (opts?.week !== undefined) params.set("week", String(opts.week));

    const data = await fetchJson<{ events?: Array<Record<string, unknown>> }>(
      `${ESPN_SITE}/scoreboard?${params.toString()}`,
    );

    return (data.events ?? [])
      .map((event) => parseEvent(event, teamIdByEspn))
      .filter((g): g is Game => Boolean(g));
  }

  async getTeamSchedule(
    league: LeagueSlug,
    teamProviderId: string,
    season?: number,
  ): Promise<Game[]> {
    if (league !== "nfl") return [];
    const teamIdByEspn = await this.teamIdMap();

    const year = season ?? new Date().getUTCFullYear();
    const data = await fetchJson<{ events?: Array<Record<string, unknown>> }>(
      `${ESPN_SITE}/teams/${teamProviderId}/schedule?season=${year}`,
    );

    return (data.events ?? [])
      .map((event) => parseEvent(event, teamIdByEspn))
      .filter((g): g is Game => Boolean(g));
  }
}

export const espnProvider = new EspnProvider();
