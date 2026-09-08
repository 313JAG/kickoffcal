export type LeagueSlug = "nfl";

export type BroadcastType = "tv" | "streaming" | "radio" | "other";
export type BroadcastMarket = "national" | "home" | "away" | "local" | "unknown";

export type BroadcastOutlet = {
  name: string;
  type: BroadcastType;
  market: BroadcastMarket;
  region?: string;
};

export type ExternalLink = {
  provider: "espn" | "apple_sports" | "other";
  label: string;
  url: string;
};

export type GameStatus =
  | "scheduled"
  | "in_progress"
  | "final"
  | "postponed"
  | "canceled"
  | "unknown";

export type Team = {
  id: string;
  league: LeagueSlug;
  slug: string;
  name: string;
  abbreviation: string;
  location: string;
  nickname: string;
  logoUrl: string;
  conference?: string;
  division?: string;
  providerIds: Record<string, string>;
  feedToken: string;
};

export type Game = {
  id: string;
  league: LeagueSlug;
  season: number;
  seasonType: number;
  week?: number;
  kickoffUtc: string;
  homeTeamId: string;
  awayTeamId: string;
  venue?: string;
  status: GameStatus;
  statusDetail?: string;
  homeScore?: number;
  awayScore?: number;
  broadcasts: BroadcastOutlet[];
  links: ExternalLink[];
  providerIds: Record<string, string>;
  sequence: number;
  lastSyncedAt: string;
};

export type ScoreMode = "off" | "final_only" | "live_and_final";

export type FeedPreferences = {
  emojiEnabled: boolean;
  scoreMode: ScoreMode;
};

export type LeagueCache = {
  league: LeagueSlug;
  season: number;
  syncedAt: string;
  teams: Team[];
  games: Game[];
};

export interface SportsProvider {
  readonly id: string;
  listTeams(league: LeagueSlug): Promise<Team[]>;
  getScoreboard(
    league: LeagueSlug,
    opts?: { season?: number; week?: number; seasonType?: number },
  ): Promise<Game[]>;
  getTeamSchedule(
    league: LeagueSlug,
    teamProviderId: string,
    season?: number,
  ): Promise<Game[]>;
}
