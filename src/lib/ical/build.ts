import ical, { ICalCalendarMethod, ICalEventBusyStatus } from "ical-generator";
import type { FeedPreferences, Game, Team } from "@/lib/sports/types";

const DEFAULT_PREFS: FeedPreferences = {
  emojiEnabled: true,
  scoreMode: "live_and_final",
};

function formatBroadcasts(game: Game): string {
  if (!game.broadcasts.length) return "TV: TBD";
  const tv = game.broadcasts.filter((b) => b.type === "tv");
  const streaming = game.broadcasts.filter((b) => b.type === "streaming");
  const other = game.broadcasts.filter(
    (b) => b.type !== "tv" && b.type !== "streaming",
  );

  const lines: string[] = [];
  if (tv.length) {
    lines.push(
      `TV: ${tv.map((b) => `${b.name}${b.market !== "unknown" ? ` (${b.market})` : ""}`).join(", ")}`,
    );
  }
  if (streaming.length) {
    lines.push(
      `Streaming: ${streaming.map((b) => `${b.name}${b.market !== "unknown" ? ` (${b.market})` : ""}`).join(", ")}`,
    );
  }
  if (other.length) {
    lines.push(`Also: ${other.map((b) => b.name).join(", ")}`);
  }
  return lines.join("\n");
}

function scoreSuffix(game: Game, prefs: FeedPreferences): string {
  if (prefs.scoreMode === "off") return "";
  const hasScores =
    game.homeScore !== undefined && game.awayScore !== undefined;
  if (!hasScores) return "";

  if (game.status === "final") {
    return ` ${game.awayScore}-${game.homeScore} (Final)`;
  }
  if (game.status === "in_progress" && prefs.scoreMode === "live_and_final") {
    const detail = game.statusDetail ? ` ${game.statusDetail}` : " Live";
    return ` ${game.awayScore}-${game.homeScore} (${detail.trim()})`;
  }
  return "";
}

export function buildEventTitle(
  game: Game,
  away: Team,
  home: Team,
  prefs: FeedPreferences = DEFAULT_PREFS,
): string {
  const emoji = prefs.emojiEnabled ? "🏈 " : "";
  const base = `${away.abbreviation} @ ${home.abbreviation}`;
  return `${emoji}${base}${scoreSuffix(game, prefs)}`.trim();
}

export function buildEventDescription(
  game: Game,
  away: Team,
  home: Team,
): string {
  const lines = [
    `${away.name} at ${home.name}`,
    formatBroadcasts(game),
  ];
  if (game.venue) lines.push(`Venue: ${game.venue}`);
  if (game.week) lines.push(`Week ${game.week}`);
  if (game.statusDetail) lines.push(`Status: ${game.statusDetail}`);

  for (const link of game.links) {
    lines.push(`${link.label}: ${link.url}`);
  }

  lines.push("");
  lines.push("Powered by KickoffCal — schedules stay on your calendar.");
  return lines.join("\n");
}

export function buildTeamCalendarIcs(opts: {
  team: Team;
  games: Game[];
  teamsById: Map<string, Team>;
  prefs?: FeedPreferences;
  feedUrl: string;
}): string {
  const prefs = opts.prefs ?? DEFAULT_PREFS;
  const calendar = ical({
    name: `${opts.team.name} — KickoffCal`,
    prodId: {
      company: "KickoffCal",
      product: "KickoffCal",
      language: "EN",
    },
    timezone: "UTC",
    method: ICalCalendarMethod.PUBLISH,
    ttl: 60 * 60,
    url: opts.feedUrl,
    scale: "GREGORIAN",
  });

  for (const game of opts.games) {
    const away = opts.teamsById.get(game.awayTeamId);
    const home = opts.teamsById.get(game.homeTeamId);
    if (!away || !home) continue;

    const start = new Date(game.kickoffUtc);
    if (Number.isNaN(start.getTime())) continue;
    const end = new Date(start.getTime() + 3.5 * 60 * 60 * 1000);

    const espnLink = game.links.find((l) => l.provider === "espn")?.url;

    calendar.createEvent({
      id: `${game.id}@kickoffcal.app`,
      start,
      end,
      summary: buildEventTitle(game, away, home, prefs),
      description: buildEventDescription(game, away, home),
      location: game.venue,
      url: espnLink,
      stamp: new Date(game.lastSyncedAt),
      lastModified: new Date(game.lastSyncedAt),
      sequence: game.sequence,
      busystatus: ICalEventBusyStatus.BUSY,
      categories: [
        { name: "NFL" },
        { name: opts.team.abbreviation },
      ],
    });
  }

  // ical-generator supports ttl -> REFRESH-INTERVAL; also add X-PUBLISHED-TTL via x props if available
  const body = calendar.toString();
  if (!body.includes("X-PUBLISHED-TTL")) {
    return body.replace(
      "BEGIN:VCALENDAR",
      "BEGIN:VCALENDAR\r\nX-PUBLISHED-TTL:PT1H\r\nX-WR-CALDESC:Live NFL schedule feed from KickoffCal",
    );
  }
  return body;
}
