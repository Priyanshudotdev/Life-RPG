"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { useGame } from "@/lib/store";

export default function GameLayout({ children }: { children: ReactNode }) {
  const { loading, hasPlayer } = useGame();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !hasPlayer) router.replace("/onboarding");
  }, [loading, hasPlayer, router]);

  if (loading || !hasPlayer) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <p className="font-display text-sm font-semibold text-ink-400">
          Opening your journal…
        </p>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
