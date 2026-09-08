import { NextResponse } from "next/server";
import {
  getGamesForTeam,
  getTeamByFeedToken,
  getTeamMap,
} from "@/lib/db/cache";
import { buildTeamCalendarIcs } from "@/lib/ical/build";
import { parsePreferences } from "@/lib/auth/preferences";
import { teamFeedUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { token: string };

export async function GET(
  request: Request,
  context: { params: Promise<Params> },
) {
  const { token: rawToken } = await context.params;
  const token = rawToken.replace(/\.ics$/i, "");
  const team = await getTeamByFeedToken(token);

  if (!team) {
    return new NextResponse("Calendar not found", { status: 404 });
  }

  const url = new URL(request.url);
  const prefs = parsePreferences(
    url.searchParams.get("prefs") ??
      request.headers.get("x-kickoffcal-prefs"),
  );

  // Also accept query toggles for personalized public links
  if (url.searchParams.has("emoji")) {
    prefs.emojiEnabled = url.searchParams.get("emoji") !== "0";
  }
  const score = url.searchParams.get("scores");
  if (score === "off" || score === "final_only" || score === "live_and_final") {
    prefs.scoreMode = score;
  }

  const [games, teamsById] = await Promise.all([
    getGamesForTeam(team.id),
    getTeamMap(),
  ]);

  const body = buildTeamCalendarIcs({
    team,
    games,
    teamsById,
    prefs,
    feedUrl: teamFeedUrl(team.feedToken),
  });

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${team.slug}.ics"`,
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
