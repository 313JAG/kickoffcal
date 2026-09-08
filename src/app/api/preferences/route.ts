import { NextResponse } from "next/server";
import {
  PREFS_COOKIE,
  parsePreferences,
  serializePreferences,
} from "@/lib/auth/preferences";
import type { FeedPreferences } from "@/lib/sports/types";

export async function GET(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${PREFS_COOKIE}=`));
  const value = match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
  return NextResponse.json(parsePreferences(value));
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<FeedPreferences>;
  const prefs = parsePreferences(JSON.stringify(body));
  const response = NextResponse.json(prefs);
  response.cookies.set(PREFS_COOKIE, serializePreferences(prefs), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
