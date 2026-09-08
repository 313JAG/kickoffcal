import { NextResponse } from "next/server";
import { syncNflCache } from "@/lib/db/cache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cache = await syncNflCache(true);
  return NextResponse.json({
    ok: true,
    league: cache.league,
    season: cache.season,
    teams: cache.teams.length,
    games: cache.games.length,
    syncedAt: cache.syncedAt,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
