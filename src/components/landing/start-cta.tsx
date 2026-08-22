"use client";

import { track } from "@vercel/analytics";
import { ArrowRight } from "lucide-react";
import { useGame } from "@/lib/store";

/**
 * Smart hero CTA: returning players continue where they left off,
 * new visitors head to onboarding.
 */
export function StartCta() {
  const { loading, hasPlayer, player } = useGame();

  if (loading) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-12 w-56 animate-pulse items-center justify-center rounded-full bg-parchment-300/70"
      />
    );
  }

  if (hasPlayer) {
    return (
      <a
        href="/dashboard"
        onClick={() => void track("cta_continue")}
        className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink-900 px-7 py-3.5 font-display text-sm font-bold text-parchment-50 transition-all hover:-translate-y-0.5 hover:bg-ink-700 hover:shadow-lift active:scale-[0.98]"
      >
        Continue as {player?.name ?? "yourself"}
        <ArrowRight className="h-4 w-4" />
      </a>
    );
  }

  return (
    <a
      href="/onboarding"
      onClick={() => void track("cta_start_adventure")}
      className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink-900 px-7 py-3.5 font-display text-sm font-bold text-parchment-50 transition-all hover:-translate-y-0.5 hover:bg-ink-700 hover:shadow-lift active:scale-[0.98]"
    >
      Start your adventure
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}
