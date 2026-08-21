"use client";

import { CalendarCheck, Coins, Hammer, ScrollText, Sparkles, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { Panel } from "@/components/ui/panel";
import { db, PLAYER_ID } from "@/lib/db";
import type { LogSourceType } from "@/lib/types";
import { cn, formatTimestamp } from "@/lib/utils";

const SOURCE_META: Record<LogSourceType, { icon: LucideIcon; classes: string }> = {
  habit: { icon: CalendarCheck, classes: "border-moss-300 bg-moss-100 text-moss-600" },
  skill: { icon: Sparkles, classes: "border-gold-400 bg-gold-100 text-gold-700" },
  project: { icon: Hammer, classes: "border-plum-300 bg-plum-100 text-plum-600" },
  shop: { icon: Store, classes: "border-terra-300 bg-terra-100 text-terra-600" },
  system: { icon: ScrollText, classes: "border-parchment-400 bg-parchment-100 text-ink-500" },
};

export default function LogPage() {
  const entries = useLiveQuery(
    async () => {
      const all = await db.activityLog
        .where("playerId")
        .equals(PLAYER_ID)
        .reverse()
        .sortBy("timestamp");
      return all;
    },
    []
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Activity Log</h1>
        <p className="mt-1 text-sm text-ink-500">
          Your adventure chronicle — newest first.
        </p>
      </div>

      {entries !== undefined && entries.length === 0 ? (
        <Panel className="py-12 text-center">
          <p className="font-display font-semibold text-ink-400">
            Nothing logged yet. Go check in a habit!
          </p>
        </Panel>
      ) : (
        <ol className="relative space-y-3 before:absolute before:left-[21px] before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-parchment-400">
          {(entries ?? []).map((e) => {
            const meta = SOURCE_META[e.sourceType] ?? SOURCE_META.system;
            const Icon = meta.icon;
            return (
              <li key={e.id} className="relative flex items-start gap-3">
                <span
                  className={cn(
                    "z-10 grid h-11 w-11 shrink-0 place-items-center rounded-xl border shadow-panel",
                    meta.classes
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="panel flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-700">{e.message}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-ink-400">
                      {formatTimestamp(e.timestamp)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    {e.xpGained > 0 && (
                      <span className="flex items-center gap-1 font-mono text-xs font-bold text-gold-600">
                        <Sparkles className="h-3 w-3" /> +{e.xpGained} XP
                      </span>
                    )}
                    {e.coinsGained !== 0 && (
                      <span
                        className={cn(
                          "flex items-center gap-1 font-mono text-xs font-bold",
                          e.coinsGained > 0 ? "text-gold-600" : "text-terra-600"
                        )}
                      >
                        <Coins className="h-3 w-3" />
                        {e.coinsGained > 0 ? "+" : ""}
                        {e.coinsGained}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
