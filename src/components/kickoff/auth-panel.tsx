"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 bg-black/20 p-5 text-sm text-[#9bc7a8]">
        <p className="font-medium text-[#f4f0e6]">Supabase auth ready to wire</p>
        <p className="mt-2">
          Add <code className="text-[#e8b84a]">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-[#e8b84a]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to
          enable magic-link login. Preferences already work via cookies for this
          PoC.
        </p>
      </div>
    );
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/account`,
        },
      });
      if (error) throw error;
      setMessage("Check your email for a magic link.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={sendMagicLink} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-[#f4f0e6]">
          Email magic link
        </Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="border-white/15 bg-black/20 text-[#f4f0e6]"
        />
      </div>
      <Button
        type="submit"
        disabled={busy}
        className="bg-[#e8b84a] text-[#142018] hover:bg-[#f0c968]"
      >
        {busy ? "Sending…" : "Send magic link"}
      </Button>
      {message && <p className="text-xs text-[#9bc7a8]">{message}</p>}
    </form>
  );
}
