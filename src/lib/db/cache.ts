import { promises as fs } from "fs";
import path from "path";
import { getSportsProvider } from "@/lib/sports";
import type { Game, LeagueCache, Team } from "@/lib/sports/types";

const CACHE_PATH = path.join(process.cwd(), "data", "nfl-cache.json");
const STALE_MS = 15 * 60 * 1000;

/** In-memory fallback for read-only hosts (Vercel serverless). */
let memoryCache: LeagueCache | null = null;

function mergeGames(existing: Game[], incoming: Game[]): Game[] {
  const byId = new Map(existing.map((g) => [g.id, g]));
  for (const game of incoming) {
    const prev = byId.get(game.id);
    if (!prev) {
      byId.set(game.id, game);
      continue;
    }
    const changed =
      prev.kickoffUtc !== game.kickoffUtc ||
      prev.status !== game.status ||
      prev.homeScore !== game.homeScore ||
      prev.awayScore !== game.awayScore ||
      JSON.stringify(prev.broadcasts) !== JSON.stringify(game.broadcasts);

    byId.set(game.id, {
      ...game,
      sequence: changed ? prev.sequence + 1 : prev.sequence,
      lastSyncedAt: new Date().toISOString(),
    });
  }
  return Array.from(byId.values()).sort((a, b) =>
    a.kickoffUtc.localeCompare(b.kickoffUtc),
  );
}

async function readCacheFile(): Promise<LeagueCache | null> {
  if (memoryCache) return memoryCache;
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw) as LeagueCache;
    memoryCache = parsed;
    return parsed;
  } catch {
    return null;
  }
}

async function writeCacheFile(cache: LeagueCache): Promise<void> {
  memoryCache = cache;
  try {
    await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
    await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
  } catch {
    // Read-only filesystem (e.g. Vercel) — memory cache is enough for this instance.
  }
}

export async function syncNflCache(force = false): Promise<LeagueCache> {
  const existing = await readCacheFile();
  if (
    !force &&
    existing &&
    Date.now() - new Date(existing.syncedAt).getTime() < STALE_MS
  ) {
    return existing;
  }

  try {
    const provider = getSportsProvider();
    const season = new Date().getUTCFullYear();
    const teams = await provider.listTeams("nfl");

    const weeks = Array.from({ length: 18 }, (_, i) => i + 1);
    const scoreboards = await Promise.all(
      weeks.map((week) =>
        provider
          .getScoreboard("nfl", { season, week, seasonType: 2 })
          .catch(() => [] as Game[]),
      ),
    );

    const preseason = await Promise.all(
      [1, 2, 3, 4].map((week) =>
        provider
          .getScoreboard("nfl", { season, week, seasonType: 1 })
          .catch(() => [] as Game[]),
      ),
    );

    const incoming = [...scoreboards.flat(), ...preseason.flat()];
    if (incoming.length === 0 && existing) {
      return existing;
    }

    const games = mergeGames(existing?.games ?? [], incoming);
    const teamById = new Map(teams.map((t) => [t.id, t]));
    const enriched = games.map((game) => {
      const home = teamById.get(game.homeTeamId);
      const links = game.links.map((link) => {
        if (link.provider !== "apple_sports") return link;
        return {
          ...link,
          url: "https://sports.apple.com/us/league/nfl",
        };
      });
      if (!links.some((l) => l.provider === "apple_sports")) {
        links.push({
          provider: "apple_sports",
          label: "Apple Sports",
          url: "https://sports.apple.com/us/league/nfl",
        });
      }
      if (home) {
        const apple = links.find((l) => l.provider === "apple_sports");
        if (apple) {
          apple.url = `https://sports.apple.com/us/search?q=${encodeURIComponent(home.name)}`;
        }
      }
      return { ...game, links };
    });

    const cache: LeagueCache = {
      league: "nfl",
      season,
      syncedAt: new Date().toISOString(),
      teams: teams.length ? teams : (existing?.teams ?? []),
      games: enriched,
    };

    await writeCacheFile(cache);
    return cache;
  } catch (err) {
    if (existing) return existing;
    throw err;
  }
}

export async function getNflCache(): Promise<LeagueCache> {
  return syncNflCache(false);
}

export async function getAllTeams(): Promise<Team[]> {
  const cache = await getNflCache();
  return cache.teams.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTeamBySlug(slug: string): Promise<Team | undefined> {
  const teams = await getAllTeams();
  return teams.find((t) => t.slug === slug);
}

export async function getTeamByFeedToken(
  token: string,
): Promise<Team | undefined> {
  const teams = await getAllTeams();
  return teams.find((t) => t.feedToken === token);
}

export async function getGamesForTeam(teamId: string): Promise<Game[]> {
  const cache = await getNflCache();
  return cache.games.filter(
    (g) => g.homeTeamId === teamId || g.awayTeamId === teamId,
  );
}

export async function getTeamMap(): Promise<Map<string, Team>> {
  const teams = await getAllTeams();
  return new Map(teams.map((t) => [t.id, t]));
}
