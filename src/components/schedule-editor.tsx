"use client";

import { CalendarClock, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/input";
import {
  RECURRENCE_PRESETS,
  TIME_OF_DAY_PRESETS,
  defaultSchedule,
  formatScheduleLabel,
} from "@/lib/schedule";
import type { Schedule, TimeOfDay } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function Pill({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-moss-600 bg-moss-100 text-moss-700"
          : "border-parchment-400 bg-parchment-50 text-ink-500 hover:border-parchment-500",
        className
      )}
    >
      {children}
    </button>
  );
}

/**
 * Notion-style recurrence editor for a habit or goal.
 * Renders inline; call onSave to persist, onRemove to revert to "anytime".
 */
export function ScheduleEditor({
  ownerId,
  ownerType,
  current,
  onSave,
  onRemove,
}: {
  ownerId: string;
  ownerType: Schedule["ownerType"];
  current: Schedule | undefined;
  onSave: (patch: Partial<Schedule>) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState<Schedule>(
    () => current ?? defaultSchedule(ownerId, ownerType)
  );

  function patch(p: Partial<Schedule>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function setTimeOfDay(t: TimeOfDay) {
    if (t === "custom") {
      patch({ timeOfDay: "custom", customTime: draft.customTime ?? "08:00" });
    } else {
      patch({ timeOfDay: t });
    }
  }

  function toggleCustomDay(day: number) {
    const days = new Set(draft.customDays ?? []);
    if (days.has(day)) days.delete(day);
    else days.add(day);
    patch({ customDays: [...days] });
  }

  return (
    <div className="rounded-xl border border-parchment-300 bg-parchment-100/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-[0.12em] text-ink-400">
          <CalendarClock className="h-3.5 w-3.5" /> Schedule
        </p>
        <span className="font-mono text-[11px] text-ink-400">
          {formatScheduleLabel(draft)}
        </span>
      </div>

      <div className="mt-3">
        <FieldLabel>When</FieldLabel>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {TIME_OF_DAY_PRESETS.map((p) => (
            <Pill key={p.value} active={draft.timeOfDay === p.value} onClick={() => setTimeOfDay(p.value)}>
              {p.label}
            </Pill>
          ))}
          <Pill active={draft.timeOfDay === "custom"} onClick={() => setTimeOfDay("custom")}>
            Custom…
          </Pill>
        </div>
        {draft.timeOfDay === "custom" && (
          <input
            type="time"
            value={draft.customTime ?? "08:00"}
            aria-label="Custom time"
            onChange={(e) => patch({ customTime: e.target.value })}
            className="mt-2 rounded-xl border border-parchment-400 bg-parchment-50 px-3 py-2 text-sm text-ink-800 focus:border-moss-500 focus:outline-none"
          />
        )}
      </div>

      <div className="mt-4">
        <FieldLabel>Repeats</FieldLabel>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {RECURRENCE_PRESETS.map((r) => (
            <Pill
              key={r.value}
              active={draft.recurrenceType === r.value}
              onClick={() =>
                patch({
                  recurrenceType: r.value,
                  intervalWeeks:
                    r.value === "weekly" ? 1 : r.value === "biweekly" ? 2 : draft.intervalWeeks,
                })
              }
            >
              {r.label}
            </Pill>
          ))}
        </div>

        {draft.recurrenceType === "custom" && (
          <div className="mt-2 flex gap-1" role="group" aria-label="Days of week">
            {WEEKDAY_LETTERS.map((letter, day) => {
              const active = (draft.customDays ?? []).includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-label={`${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]} ${active ? "on" : "off"}`}
                  aria-pressed={active}
                  onClick={() => toggleCustomDay(day)}
                  className={cn(
                    "h-8 w-8 cursor-pointer rounded-lg border font-mono text-xs font-bold transition-colors",
                    active
                      ? "border-moss-600 bg-moss-500 text-parchment-50"
                      : "border-parchment-400 bg-parchment-50 text-ink-400 hover:border-parchment-500"
                  )}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}

        {(draft.recurrenceType === "weekly" || draft.recurrenceType === "biweekly") && (
          <div className="mt-2 flex items-center gap-2 text-sm text-ink-600">
            <span>Every</span>
            <input
              type="number"
              min={1}
              max={12}
              value={draft.intervalWeeks ?? 1}
              aria-label="Interval in weeks"
              onChange={(e) =>
                patch({ intervalWeeks: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })
              }
              className="w-16 rounded-xl border border-parchment-400 bg-parchment-50 px-2 py-1.5 text-center font-mono text-sm focus:border-moss-500 focus:outline-none"
            />
            <span>{(draft.intervalWeeks ?? 1) === 1 ? "week" : "weeks"}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button size="sm" onClick={() => onSave({ ...draft })}>
          Set my times
        </Button>
        <button
          type="button"
          onClick={onRemove}
          className="flex cursor-pointer items-center gap-1 text-xs font-medium text-ink-400 hover:text-terra-600"
        >
          <X className="h-3.5 w-3.5" /> Clear schedule
        </button>
      </div>
    </div>
  );
}

/** Compact subtitle shown under a habit/goal name. */
export function ScheduleSubtitle({ schedule }: { schedule: Schedule | undefined }) {
  if (!schedule) return null;
  return (
    <p className="font-mono text-[11px] text-ink-400">{formatScheduleLabel(schedule)}</p>
  );
}
