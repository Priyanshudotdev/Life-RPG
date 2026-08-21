"use client";

import { Compass } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useGame } from "@/lib/store";

/**
 * First-run detection: no player record → onboarding, otherwise dashboard.
 */
export default function Home() {
  const { loading, hasPlayer } = useGame();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(hasPlayer ? "/dashboard" : "/onboarding");
  }, [loading, hasPlayer, router]);

  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center gap-3 text-ink-400">
        <span className="grid h-14 w-14 animate-pulse place-items-center rounded-2xl border border-moss-700 bg-moss-500 text-parchment-50 shadow-[0_2px_0_0_var(--color-moss-700)]">
          <Compass className="h-7 w-7" />
        </span>
        <p className="font-display text-sm font-semibold tracking-wide">
          Unrolling the map…
        </p>
      </div>
    </div>
  );
}
