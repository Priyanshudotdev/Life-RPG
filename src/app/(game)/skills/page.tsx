"use client";

import { X } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Panel, PanelTitle } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/segmented-bar";
import { db, PLAYER_ID } from "@/lib/db";
import { useGame } from "@/lib/store";
import type { Skill } from "@/lib/types";
import { cn, formatTimestamp } from "@/lib/utils";

const CATEGORY_TONES: Record<string, string> = {
  Mind: "border-plum-300 bg-plum-100 text-plum-600",
  Body: "border-terra-300 bg-terra-100 text-terra-600",
  World: "border-gold-400 bg-gold-100 text-gold-700",
  Craft: "border-moss-300 bg-moss-100 text-moss-600",
};

export default function SkillsPage() {
  const { skills } = useGame();
  const [selected, setSelected] = useState<Skill | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Skills</h1>
        <p className="mt-1 text-sm text-ink-500">
          Habit check-ins feed these automatically. Tap a card to see its XP history.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => (
          <button
            key={skill.id}
            onClick={() => setSelected(skill)}
            className={cn(
              "panel cursor-pointer p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift",
              selected?.id === skill.id && "border-moss-500"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-bold text-ink-900">{skill.name}</h3>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider",
                  CATEGORY_TONES[skill.category] ?? "border-parchment-400 bg-parchment-100 text-ink-500"
                )}
              >
                {skill.category}
              </span>
            </div>
            <p className="mt-0.5 font-display text-xs font-semibold italic text-ink-400">
              {skill.rank}
            </p>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-mono text-sm font-bold text-moss-600">
                Lv. {skill.level}
              </span>
              <span className="font-mono text-[11px] text-ink-400">
                {skill.xp}/{skill.xpToNext} XP
              </span>
            </div>
            <ProgressBar
              pct={(skill.xp / skill.xpToNext) * 100}
              tone="gold"
              className="mt-1.5"
            />
          </button>
        ))}
      </div>

      {/* XP history mini-log */}
      {selected && <SkillHistory skill={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function SkillHistory({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  // MVP: match log entries that mention this skill by name.
  const entries = useLiveQuery(
    async () => {
      const all = await db.activityLog
        .where("playerId")
        .equals(PLAYER_ID)
        .reverse()
        .sortBy("timestamp");
      return all.filter((e) => e.message.includes(skill.name)).slice(0, 12);
    },
    [skill.id]
  );

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <PanelTitle>{skill.name} — XP History</PanelTitle>
        <button
          aria-label="Close history"
          onClick={onClose}
          className="cursor-pointer rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-parchment-200 hover:text-ink-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {entries === undefined ? null : entries.length === 0 ? (
        <p className="mt-4 text-sm italic text-ink-400">
          No XP recorded for this skill yet — check in a related habit.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-parchment-300 bg-parchment-100 px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-ink-700">{e.message}</span>
              <span className="shrink-0 font-mono text-[11px] text-ink-400">
                {formatTimestamp(e.timestamp)}
              </span>
              {e.xpGained > 0 && (
                <span className="shrink-0 font-mono text-xs font-bold text-moss-600">
                  +{e.xpGained} XP
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
