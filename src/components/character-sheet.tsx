"use client";

import { Heart, Coins, Sparkles } from "lucide-react";
import { Portrait } from "./portrait";
import { SegmentedBar } from "./ui/segmented-bar";
import type { Player } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CharacterSheet({
  player,
  className,
  compact = false,
}: {
  player: Player;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("panel p-5", className)}>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-parchment-400 shadow-panel">
          <Portrait portraitId={player.portraitId} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h1 className="truncate font-display text-xl font-bold text-ink-900">
              {player.name}
            </h1>
            <span className="shrink-0 rounded-full border border-gold-500 bg-gold-100 px-2.5 py-0.5 font-mono text-xs font-bold text-gold-700">
              Lv. {player.level}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            <StatRow
              icon={<Heart className="h-3.5 w-3.5 text-terra-500" />}
              label="HP"
              value={player.hp}
              max={player.hpMax}
              tone="hp"
            />
            <StatRow
              icon={<Sparkles className="h-3.5 w-3.5 text-plum-500" />}
              label="Focus"
              value={player.focus}
              max={player.focusMax}
              tone="focus"
            />
          </div>
        </div>
      </div>

      {!compact && (
        <>
          <div className="rule-dashed my-4" />
          <div className="rounded-xl border border-moss-300 bg-moss-50 p-3">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-moss-600">
              Targets
            </p>
            {player.targets?.length ? (
              <ol className="mt-1.5 space-y-1">
                {player.targets.map((t, i) => (
                  <li key={t.id} className="flex items-baseline gap-2 text-sm">
                    <span className="shrink-0 font-mono text-[11px] font-bold text-moss-500">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-medium text-ink-700">{t.text}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-1 text-sm text-ink-400">—</p>
            )}
          </div>
          {(player.strengths?.length || player.weaknesses?.length) && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <FlavorBlock label="Strengths" values={player.strengths} tone="moss" />
              <FlavorBlock label="Weaknesses" values={player.weaknesses} tone="terra" />
            </div>
          )}
        </>
      )}

      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-gold-400 bg-gold-100 px-3 py-1">
        <Coins className="h-3.5 w-3.5 text-gold-600" />
        <span className="font-mono text-sm font-bold text-gold-700">{player.coins}</span>
      </div>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  max,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  max: number;
  tone: "hp" | "focus";
}) {
  const segments = 10;
  return (
    <div className="flex items-center gap-2">
      <span className="flex w-14 items-center gap-1 font-mono text-[11px] font-bold text-ink-500">
        {icon}
        {label}
      </span>
      <SegmentedBar
        value={Math.round((value / max) * segments)}
        max={segments}
        tone={tone}
        className="flex-1"
        label={label}
      />
      <span className="w-12 shrink-0 text-right font-mono text-[11px] text-ink-400">
        {value}/{max}
      </span>
    </div>
  );
}

function FlavorBlock({
  label,
  values,
  tone,
}: {
  label: string;
  values: string[];
  tone: "moss" | "terra";
}) {
  // Legacy records may still hold a single string here.
  const raw = values as unknown;
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === "string" && raw.trim()
      ? [raw.trim()]
      : [];
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        tone === "moss"
          ? "border-moss-300 bg-moss-50"
          : "border-terra-300 bg-terra-100/60"
      )}
    >
      <p
        className={cn(
          "font-display text-[11px] font-bold uppercase tracking-[0.12em]",
          tone === "moss" ? "text-moss-600" : "text-terra-600"
        )}
      >
        {label}
      </p>
      {list.length ? (
        <ul className="mt-1.5 space-y-1">
          {list.map((v, i) => (
            <li key={`${v}-${i}`} className="line-clamp-2 text-sm italic text-ink-500">
              {v}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm italic text-ink-400">—</p>
      )}
    </div>
  );
}
