import { espnProvider } from "./espn";
import type { SportsProvider } from "./types";

export function getSportsProvider(): SportsProvider {
  // Swap adapters here later (SportsDataIO / Sportradar) without rewriting feeds/UI.
  return espnProvider;
}

export * from "./types";
export { espnProvider } from "./espn";
