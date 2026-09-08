import { syncNflCache } from "../src/lib/db/cache";

async function main() {
  console.log("Syncing NFL cache from ESPN…");
  const cache = await syncNflCache(true);
  console.log(
    `Done: ${cache.teams.length} teams, ${cache.games.length} games (season ${cache.season})`,
  );
  console.log(`Wrote data/nfl-cache.json at ${cache.syncedAt}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
