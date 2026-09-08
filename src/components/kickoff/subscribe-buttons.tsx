"use client";

import { useEffect, useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FeedPreferences } from "@/lib/sports/types";
import { defaultPreferences } from "@/lib/auth/preferences";

type Props = {
  feedToken: string;
  teamName: string;
};

function withPrefs(baseUrl: string, prefs: FeedPreferences): string {
  const url = new URL(baseUrl);
  url.searchParams.set("emoji", prefs.emojiEnabled ? "1" : "0");
  url.searchParams.set("scores", prefs.scoreMode);
  return url.toString();
}

export function SubscribeButtons({ feedToken, teamName }: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedWebcal, setCopiedWebcal] = useState(false);
  const [prefs, setPrefs] = useState<FeedPreferences>(defaultPreferences);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((data: FeedPreferences) => setPrefs(data))
      .catch(() => undefined);
  }, []);

  const httpsUrl = useMemo(() => {
    const base = `${origin || "http://127.0.0.1:43123"}/api/cal/${feedToken}.ics`;
    return withPrefs(base, prefs);
  }, [feedToken, prefs, origin]);

  const webcal = httpsUrl.replace(/^https?:\/\//, "webcal://");

  async function copyHttps() {
    await navigator.clipboard.writeText(httpsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyWebcal() {
    await navigator.clipboard.writeText(webcal);
    setCopiedWebcal(true);
    setTimeout(() => setCopiedWebcal(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[#9bc7a8]">
        Built for <span className="text-[#d7e6db]">Apple Calendar</span> and{" "}
        <span className="text-[#d7e6db]">iCloud</span> — one live calendar per
        team so you can toggle teams on and off in the Calendar app. Not a
        one-time file download.
      </p>

      <a
        href={webcal}
        className={cn(
          buttonVariants({ size: "lg" }),
          "w-full bg-[#e8b84a] text-[#142018] hover:bg-[#f0c968] sm:w-auto",
        )}
      >
        Add to Apple Calendar
      </a>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-[#d7e6db]">
        <p className="font-medium text-[#f4f0e6]">On iPhone / iPad</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[#9bc7a8]">
          <li>Tap <span className="text-[#d7e6db]">Add to Apple Calendar</span> in Safari</li>
          <li>Confirm the subscription — it syncs through iCloud</li>
          <li>
            Optional: Settings → Calendar → Accounts → subscribed calendar →
            set Refresh to every 15 minutes (or 5 on Mac) for fresher scores
          </li>
        </ol>
        <p className="mt-3 font-medium text-[#f4f0e6]">On Mac</p>
        <p className="mt-1 text-[#9bc7a8]">
          Click the button above, or File → New Calendar Subscription and paste
          the webcal link. Right-click the calendar → Get Info → Auto-refresh.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyWebcal}
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "border-white/10",
          )}
        >
          {copiedWebcal ? "Copied webcal://" : "Copy webcal link"}
        </button>
        <button
          type="button"
          onClick={copyHttps}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "border-white/20 text-[#f4f0e6]",
          )}
        >
          {copied ? "Copied HTTPS" : "Copy HTTPS URL"}
        </button>
      </div>

      <code className="block overflow-x-auto rounded-md bg-black/30 px-3 py-2 text-xs text-[#cfe3d6]">
        {webcal}
      </code>
      <p className="text-xs text-[#7aa389]">
        {teamName} preferences (emoji / scores) are baked into this link. After
        changing Account toggles, re-subscribe or update the subscription URL.
      </p>
    </div>
  );
}
