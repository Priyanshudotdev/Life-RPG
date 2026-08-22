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
      <div className="flex min-h-dvh" aria-busy="true" aria-label="Opening your journal…">
        <aside className="hidden h-dvh w-56 shrink-0 flex-col gap-3 border-r border-parchment-400 bg-parchment-100/80 px-4 py-6 md:flex">
          <div className="mb-4 h-9 w-full animate-pulse rounded-lg bg-parchment-300/70" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-8 w-full animate-pulse rounded-lg bg-parchment-200"
              style={{ animationDelay: `${i * 90}ms` }}
            />
          ))}
        </aside>
        <div className="flex min-w-0 flex-1 flex-col px-4 pt-6 md:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="h-7 w-40 animate-pulse rounded-lg bg-parchment-300/70" />
            <div className="h-8 w-24 animate-pulse rounded-full bg-parchment-200" />
          </div>
          <div className="mx-auto mt-6 grid w-full max-w-7xl flex-1 content-start gap-6 pb-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="h-72 animate-pulse rounded-xl border border-parchment-300 bg-parchment-100" />
            <div className="space-y-6">
              <div className="h-52 animate-pulse rounded-xl border border-parchment-300 bg-parchment-100" />
              <div className="h-32 animate-pulse rounded-xl border border-parchment-300 bg-parchment-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
