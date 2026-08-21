"use client";

import {
  BookOpen,
  Code,
  Dumbbell,
  Flame,
  Heart,
  Moon,
  PenLine,
  Plus,
  Salad,
  Sun,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel, TextInput } from "@/components/ui/input";
import { Panel, PanelTitle } from "@/components/ui/panel";
import { db, PLAYER_ID } from "@/lib/db";
import { addHabit, checkInHabit, deleteHabit, HABIT_ICONS } from "@/lib/game";
import { cn, lastNDates, todayISO } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  sun: Sun,
  "book-open": BookOpen,
  dumbbell: Dumbbell,
  "pen-line": PenLine,
  code: Code,
  salad: Salad,
  moon: Moon,
  heart: Heart,
};

export function HabitIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICON_MAP[icon] ?? Flame;
  return <Icon className={className} />;
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function HabitsPage() {
  const habits = useLiveQuery(
    () => db.habits.where("playerId").equals(PLAYER_ID).toArray(),
    []
  );
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState<string>(HABIT_ICONS[0]);
  const [flash, setFlash] = useState<{ habitId: string; text: string; ok: boolean } | null>(null);

  const week = lastNDates(7);
  const today = todayISO();

  async function handleCheckIn(id: string) {
    const result = await checkInHabit(id);
    if (!result.ok) {
      setFlash({ habitId: id, text: result.reason, ok: false });
      return;
    }
    const levelNote =
      result.leveledUpSkills.length > 0
        ? ` · ${result.leveledUpSkills.join(", ")}!`
        : "";
    setFlash({
      habitId: id,
      text: `+${result.xp} XP · +${result.coins} coins${levelNote}`,
      ok: true,
    });
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    await addHabit(newName, newIcon);
    setNewName("");
    setNewIcon(HABIT_ICONS[0]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Habits</h1>
        <p className="mt-1 text-sm text-ink-500">
          Small daily rituals. Each check-in earns XP and coins; streaks earn a bonus.
        </p>
      </div>

      {/* Add habit */}
      <Panel>
        <PanelTitle>New Habit</PanelTitle>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <FieldLabel>Name</FieldLabel>
            <TextInput
              value={newName}
              maxLength={40}
              placeholder="e.g. Morning stretch"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleAdd()}
            />
          </div>
          <div>
            <FieldLabel>Icon</FieldLabel>
            <div className="flex gap-1.5">
              {HABIT_ICONS.map((key) => {
                const Icon = ICON_MAP[key];
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={`Icon ${key}`}
                    aria-pressed={newIcon === key}
                    onClick={() => setNewIcon(key)}
                    className={cn(
                      "grid h-10 w-10 cursor-pointer place-items-center rounded-xl border transition-all",
                      newIcon === key
                        ? "border-moss-500 bg-moss-100 text-moss-600"
                        : "border-parchment-300 bg-parchment-50 text-ink-400 hover:border-parchment-400"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </button>
                );
              })}
            </div>
          </div>
          <Button onClick={() => void handleAdd()} disabled={!newName.trim()}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </Panel>

      {/* Habit list */}
      <div className="grid gap-4 md:grid-cols-2">
        {(habits ?? []).map((habit) => {
          const doneToday = habit.lastCheckInDate === today;
          return (
            <Panel key={habit.id} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-parchment-400 bg-parchment-100 text-ink-500">
                    <HabitIcon icon={habit.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display font-bold text-ink-900">{habit.name}</h3>
                    <p className="flex items-center gap-1 font-mono text-xs font-bold text-terra-600">
                      <Flame className="h-3.5 w-3.5" />
                      {habit.streakCount}-day streak
                    </p>
                  </div>
                </div>
                <button
                  aria-label={`Delete ${habit.name}`}
                  onClick={() => void deleteHabit(habit.id)}
                  className="cursor-pointer rounded-lg p-1.5 text-ink-400 opacity-60 transition-opacity hover:bg-terra-100 hover:text-terra-600 hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Weekly grid */}
              <div className="flex justify-between gap-1" aria-label="Last 7 days">
                {week.map((date) => {
                  const d = new Date(`${date}T00:00:00`);
                  const checked = habit.weeklyLog.includes(date);
                  const isToday = date === today;
                  return (
                    <div key={date} className="flex flex-col items-center gap-1">
                      <span className="font-mono text-[9px] uppercase text-ink-400">
                        {WEEKDAY_LABELS[d.getDay()]}
                      </span>
                      <span
                        title={date}
                        className={cn(
                          "h-6 w-full max-w-8 rounded-md border",
                          checked
                            ? "border-moss-700 bg-moss-500"
                            : isToday
                              ? "border-gold-500 bg-gold-100"
                              : "border-parchment-300 bg-parchment-100"
                        )}
                      />
                    </div>
                  );
                })}
              </div>

              {flash?.habitId === habit.id ? (
                <p
                  role="status"
                  className={cn(
                    "rounded-lg border px-3 py-2 text-center text-xs font-semibold",
                    flash.ok
                      ? "border-moss-300 bg-moss-50 text-moss-600"
                      : "border-terra-300 bg-terra-100/60 text-terra-600"
                  )}
                >
                  {flash.text}
                </p>
              ) : null}

              <Button
                variant={doneToday ? "secondary" : "primary"}
                disabled={doneToday}
                onClick={() => void handleCheckIn(habit.id)}
              >
                {doneToday ? "Checked in today ✓" : "Check in"}
              </Button>
            </Panel>
          );
        })}
      </div>

      {habits !== undefined && habits.length === 0 && (
        <Panel className="py-12 text-center">
          <p className="font-display font-semibold text-ink-400">
            No habits yet — add your first ritual above.
          </p>
        </Panel>
      )}
    </div>
  );
}
