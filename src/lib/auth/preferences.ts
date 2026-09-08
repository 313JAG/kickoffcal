import type { FeedPreferences, ScoreMode } from "@/lib/sports/types";

export const PREFS_COOKIE = "kickoffcal_prefs";

export const defaultPreferences: FeedPreferences = {
  emojiEnabled: true,
  scoreMode: "live_and_final",
};

export function parsePreferences(raw?: string | null): FeedPreferences {
  if (!raw) return { ...defaultPreferences };
  try {
    const parsed = JSON.parse(raw) as Partial<FeedPreferences>;
    const scoreMode: ScoreMode =
      parsed.scoreMode === "off" ||
      parsed.scoreMode === "final_only" ||
      parsed.scoreMode === "live_and_final"
        ? parsed.scoreMode
        : defaultPreferences.scoreMode;
    return {
      emojiEnabled:
        typeof parsed.emojiEnabled === "boolean"
          ? parsed.emojiEnabled
          : defaultPreferences.emojiEnabled,
      scoreMode,
    };
  } catch {
    return { ...defaultPreferences };
  }
}

export function serializePreferences(prefs: FeedPreferences): string {
  return JSON.stringify(prefs);
}
