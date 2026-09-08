"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { FeedPreferences, ScoreMode } from "@/lib/sports/types";
import { defaultPreferences } from "@/lib/auth/preferences";

export function PreferencesForm() {
  const [prefs, setPrefs] = useState<FeedPreferences>(defaultPreferences);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((data: FeedPreferences) => {
        setPrefs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save(next: FeedPreferences) {
    setPrefs(next);
    setSaved(false);
    await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaved(true);
  }

  if (loading) {
    return <p className="text-sm text-[#9bc7a8]">Loading preferences…</p>;
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="emoji" className="text-[#f4f0e6]">
            Team emoji in titles
          </Label>
          <p className="text-xs text-[#9bc7a8]">
            Prefix events with 🏈 so they stand out in a busy calendar.
          </p>
        </div>
        <Switch
          id="emoji"
          checked={prefs.emojiEnabled}
          onCheckedChange={(checked) =>
            save({ ...prefs, emojiEnabled: Boolean(checked) })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="scores" className="text-[#f4f0e6]">
          Score updates in event titles
        </Label>
        <select
          id="scores"
          value={prefs.scoreMode}
          onChange={(e) =>
            save({ ...prefs, scoreMode: e.target.value as ScoreMode })
          }
          className="h-9 rounded-lg border border-white/15 bg-black/20 px-3 text-sm text-[#f4f0e6]"
        >
          <option value="off">Off — kickoff only</option>
          <option value="final_only">Final scores only</option>
          <option value="live_and_final">Live + final scores</option>
        </select>
        <p className="text-xs text-[#9bc7a8]">
          On Mac: Calendar → Get Info → Auto-refresh (as often as every 5
          minutes). On iPhone: Settings → Apps → Calendar → Accounts → your
          KickoffCal subscription → Refresh.
        </p>
      </div>

      {saved && (
        <p className="text-xs text-[#e8b84a]">
          Saved. Re-copy subscribe links so calendar apps pick up the new query
          params.
        </p>
      )}
    </div>
  );
}
