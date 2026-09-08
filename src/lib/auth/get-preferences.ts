import { cookies } from "next/headers";
import { PREFS_COOKIE, parsePreferences } from "@/lib/auth/preferences";
import type { FeedPreferences } from "@/lib/sports/types";

export async function getPreferences(): Promise<FeedPreferences> {
  const jar = await cookies();
  return parsePreferences(jar.get(PREFS_COOKIE)?.value);
}
