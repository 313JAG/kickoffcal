import type { BroadcastOutlet } from "@/lib/sports/types";

export function WhereToWatch({ broadcasts }: { broadcasts: BroadcastOutlet[] }) {
  if (!broadcasts.length) {
    return <p className="text-sm text-[#9bc7a8]">Watch info TBD</p>;
  }

  const tv = broadcasts.filter((b) => b.type === "tv");
  const streaming = broadcasts.filter((b) => b.type === "streaming");
  const rest = broadcasts.filter((b) => b.type !== "tv" && b.type !== "streaming");

  return (
    <div className="flex flex-col gap-1 text-sm text-[#d7e6db]">
      {tv.length > 0 && (
        <p>
          <span className="text-[#9bc7a8]">TV:</span>{" "}
          {tv.map((b) => `${b.name}${b.market !== "unknown" ? ` (${b.market})` : ""}`).join(", ")}
        </p>
      )}
      {streaming.length > 0 && (
        <p>
          <span className="text-[#9bc7a8]">Streaming:</span>{" "}
          {streaming
            .map((b) => `${b.name}${b.market !== "unknown" ? ` (${b.market})` : ""}`)
            .join(", ")}
        </p>
      )}
      {rest.length > 0 && (
        <p>
          <span className="text-[#9bc7a8]">Also:</span> {rest.map((b) => b.name).join(", ")}
        </p>
      )}
    </div>
  );
}
