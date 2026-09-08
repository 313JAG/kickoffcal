import type { Metadata } from "next";
import { AuthPanel } from "@/components/kickoff/auth-panel";
import { PreferencesForm } from "@/components/kickoff/preferences-form";
import { getAllTeams } from "@/lib/db/cache";
import { teamFeedUrl } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Account",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const teams = await getAllTeams();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[#f4f0e6]">
        Account
      </h1>
      <p className="mt-2 text-[#9bc7a8]">
        Built for Apple Calendar and iCloud. Browse without logging in; sign in
        later to sync preferences. Emoji and score toggles bake into your
        subscribe links — re-add the calendar after changing them.
      </p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="mb-3 text-sm uppercase tracking-[0.2em] text-[#e8b84a]">
            Preferences
          </h2>
          <PreferencesForm />
        </section>

        <section>
          <h2 className="mb-3 text-sm uppercase tracking-[0.2em] text-[#e8b84a]">
            Sign in
          </h2>
          <AuthPanel />
        </section>

        <section>
          <h2 className="mb-3 text-sm uppercase tracking-[0.2em] text-[#e8b84a]">
            Your team feed URLs
          </h2>
          <p className="mb-3 text-sm text-[#9bc7a8]">
            One calendar per team — toggle them individually in Apple Calendar /
            iCloud.
          </p>
          <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-4 text-xs">
            {teams.map((team) => (
              <div key={team.id} className="flex flex-col gap-1 border-b border-white/5 py-2 last:border-0">
                <span className="font-medium text-[#d7e6db]">{team.name}</span>
                <code className="break-all text-[#9bc7a8]">
                  {teamFeedUrl(team.feedToken)}
                </code>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
