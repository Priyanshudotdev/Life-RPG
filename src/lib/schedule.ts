import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import type { RecurrenceType, Schedule, TimeOfDay } from "./types";
import { toISODate, todayISO } from "./utils";

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Canonical clock times shown for the quick time-of-day picks. */
export const TIME_OF_DAY_PRESETS: {
  value: TimeOfDay;
  label: string;
  /** 24h HH:mm used for the compact subtitle. */
  defaultTime: string;
}[] = [
  { value: "morning", label: "Morning", defaultTime: "08:00" },
  { value: "midday", label: "Midday", defaultTime: "12:00" },
  { value: "evening", label: "Evening", defaultTime: "18:00" },
  { value: "night", label: "Night", defaultTime: "21:00" },
];

export const RECURRENCE_PRESETS: { value: RecurrenceType; label: string }[] = [
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "custom", label: "Custom" },
];

export function defaultSchedule(ownerId: string, ownerType: Schedule["ownerType"]): Schedule {
  return {
    id: crypto.randomUUID(),
    ownerId,
    ownerType,
    timeOfDay: "morning",
    recurrenceType: "daily",
    startDate: todayISO(),
    active: true,
  };
}

/** "HH:mm" → "1:00pm" style, or "" when unknown. */
export function formatTime(hhmm: string | undefined): string {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return "";
  const [hStr, m] = hhmm.split(":");
  const h = Number(hStr);
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m}${suffix}`;
}

/** The display time for a schedule (preset canonical time or custom). */
export function scheduleTime(s: Schedule): string {
  if (s.timeOfDay === "custom") return formatTime(s.customTime);
  return formatTime(TIME_OF_DAY_PRESETS.find((p) => p.value === s.timeOfDay)?.defaultTime);
}

function recurrenceLabel(s: Schedule): string {
  switch (s.recurrenceType) {
    case "daily":
      return "Every day";
    case "weekdays":
      return "Weekdays";
    case "weekends":
      return "Weekends";
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Every 2 weeks";
    case "custom": {
      const days = [...(s.customDays ?? [])].sort((a, b) => a - b);
      if (days.length === 0) return "No days set";
      if (days.length === 7) return "Every day";
      return days.map((d) => WEEKDAY_SHORT[d]).join(", ");
    }
  }
}

/** Compact row subtitle, e.g. "6:00pm · Weekdays". */
export function formatScheduleLabel(s: Schedule | undefined): string {
  if (!s) return "Anytime · Every day";
  const time = scheduleTime(s);
  return time ? `${time} · ${recurrenceLabel(s)}` : recurrenceLabel(s);
}

/** Is this schedule due on the given local date? */
export function isDueOn(s: Schedule, date: Date): boolean {
  if (!s.active) return false;
  const weekday = date.getDay();
  switch (s.recurrenceType) {
    case "daily":
      return true;
    case "weekdays":
      return weekday >= 1 && weekday <= 5;
    case "weekends":
      return weekday === 0 || weekday === 6;
    case "weekly":
    case "biweekly": {
      const interval = Math.max(1, s.intervalWeeks ?? (s.recurrenceType === "biweekly" ? 2 : 1));
      const anchor = new Date(`${s.startDate}T00:00:00`);
      if (anchor.getDay() !== weekday) return false;
      const diffDays = Math.round((date.getTime() - anchor.getTime()) / 86_400_000);
      if (diffDays < 0) return false;
      return Math.floor(diffDays / 7) % interval === 0;
    }
    case "custom":
      return (s.customDays ?? []).includes(weekday);
  }
}

export function isDueToday(s: Schedule): boolean {
  return isDueOn(s, new Date());
}

/* ── Dexie access ─────────────────────────────────────────── */

export async function getScheduleFor(ownerId: string): Promise<Schedule | undefined> {
  return db.schedules.where("ownerId").equals(ownerId).first();
}

/** Create-or-update the schedule attached to a habit/goal. */
export async function saveScheduleForOwner(
  ownerId: string,
  ownerType: Schedule["ownerType"],
  patch: Partial<Omit<Schedule, "id" | "ownerId" | "ownerType">>
): Promise<void> {
  const existing = await getScheduleFor(ownerId);
  if (existing) {
    await db.schedules.put({ ...existing, ...patch });
  } else {
    await db.schedules.add({ ...defaultSchedule(ownerId, ownerType), ...patch });
  }
}

export async function clearScheduleForOwner(ownerId: string): Promise<void> {
  await db.schedules.where("ownerId").equals(ownerId).delete();
}

/** Live query hook: one owner's schedule (undefined while loading). */
export function useSchedule(ownerId: string | undefined): Schedule | undefined {
  return useLiveQuery(
    async () => (ownerId ? await getScheduleFor(ownerId) : undefined),
    [ownerId]
  );
}

/** Live query hook: all schedules keyed by ownerId. */
export function useScheduleMap(): Record<string, Schedule> | undefined {
  return useLiveQuery(async () => {
    const rows = await db.schedules.toArray();
    const map: Record<string, Schedule> = {};
    for (const r of rows) map[r.ownerId] = r;
    return map;
  }, []);
}

/**
 * Should a streak continue given the last check-in date and the schedule?
 * Walks back over non-due days so skipped rest days don't reset progress.
 * No schedule = legacy behavior (yesterday-or-bust).
 */
export function streakShouldContinue(
  lastCheckInDate: string | null,
  schedule: Schedule | undefined,
  today = new Date()
): boolean {
  if (!lastCheckInDate) return false;
  if (!schedule || !schedule.active) {
    const yesterday = toISODate(new Date(today.getTime() - 86_400_000));
    return lastCheckInDate === yesterday;
  }
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (isDueOn(schedule, d)) return lastCheckInDate === toISODate(d);
  }
  return false;
}
