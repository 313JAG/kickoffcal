import { promises as fs } from "fs";
import path from "path";
import { getSportsProvider } from "@/lib/sports";
import type { Game, LeagueCache, Team } from "@/lib/sports/types";

const DATA_DIR = path.join(process.cwd(), "data");
const CACHE_PATH = path.join(DATA_DIR, "nfl-cache.json");
const META_PATH = path.join(DATA_DIR, "meta.json");
const TEAMS_PATH = path.join(DATA_DIR, "teams.json");
const GAMES_DIR = path.join(DATA_DIR, "games");
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

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function readChunkedCache(): Promise<LeagueCache | null> {
  const meta = await readJsonFile<{
    league: LeagueCache["league"];
    season: number;
    syncedAt: string;
  }>(META_PATH);
  const teams = await readJsonFile<Team[]>(TEAMS_PATH);
  if (!meta || !teams?.length) return null;

  let games: Game[] = [];
  try {
    const files = (await fs.readdir(GAMES_DIR))
      .filter((f) => f.startsWith("chunk-") && f.endsWith(".json"))
      .sort();
    for (const file of files) {
      const chunk = await readJsonFile<Game[]>(path.join(GAMES_DIR, file));
      if (chunk?.length) games.push(...chunk);
    }
  } catch {
    // no games dir
  }

  if (!games.length) return null;

  return {
    league: meta.league,
    season: meta.season,
    syncedAt: meta.syncedAt,
    teams,
    games,
  };
}

async function readCacheFile(): Promise<LeagueCache | null> {
  if (memoryCache) return memoryCache;

  const chunked = await readChunkedCache();
  if (chunked) {
    memoryCache = chunked;
    return chunked;
  }

  const monolithic = await readJsonFile<LeagueCache>(CACHE_PATH);
  if (monolithic?.teams?.length) {
    memoryCache = monolithic;
    return monolithic;
  }

  return null;
}

async function writeCacheFile(cache: LeagueCache): Promise<void> {
  memoryCache = cache;
  try {
    await fs.mkdir(GAMES_DIR, { recursive: true });
    await fs.writeFile(
      META_PATH,
      JSON.stringify(
        {
          league: cache.league,
          season: cache.season,
          syncedAt: cache.syncedAt,
        },
        null,
        2,
      ) + "\n",
      "utf8",
    );
    await fs.writeFile(TEAMS_PATH, JSON.stringify(cache.teams, null, 2) + "\n", "utf8");

    const existing = await fs.readdir(GAMES_DIR).catch(() => [] as string[]);
    for (const file of existing) {
      if (file.startsWith("chunk-")) {
        await fs.unlink(path.join(GAMES_DIR, file)).catch(() => undefined);
      }
    }

    const CHUNK = 40;
    for (let i = 0; i < cache.games.length; i += CHUNK) {
      const chunk = cache.games.slice(i, i + CHUNK);
      const name = `chunk-${String(Math.floor(i / CHUNK)).padStart(2, "0")}.json`;
      await fs.writeFile(
        path.join(GAMES_DIR, name),
        JSON.stringify(chunk) + "\n",
        "utf8",
      );
    }

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
