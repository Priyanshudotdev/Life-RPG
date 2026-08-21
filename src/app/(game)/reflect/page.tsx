"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Flame, CalendarCheck, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel, PanelTitle } from "@/components/ui/panel";
import { Tabs } from "@/components/ui/tabs";
import { db, PLAYER_ID } from "@/lib/db";
import { cn, toISODate } from "@/lib/utils";

type Period = "week" | "month";

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Ordered list of every date in the period up to and including today. */
function elapsedDates(period: Period): string[] {
  const now = new Date();
  const out: string[] = [];
  if (period === "week") {
    const mondayOffset = (now.getDay() + 6) % 7; // 0 = Monday
    for (let i = 0; i <= mondayOffset; i++) {
      const d = new Date();
      d.setDate(now.getDate() - mondayOffset + i);
      out.push(toISODate(d));
    }
  } else {
    for (let day = 1; day <= now.getDate(); day++) {
      out.push(toISODate(new Date(now.getFullYear(), now.getMonth(), day)));
    }
  }
  return out;
}

export default function ReflectPage() {
  const [period, setPeriod] = useState<Period>("week");

  // Read-only: everything below derives from existing tables. Nothing writes.
  const logDates = useLiveQuery(async () => {
    const entries = await db.activityLog.where("playerId").equals(PLAYER_ID).toArray();
    return entries.map((e) => ({ date: toISODate(new Date(e.timestamp)), sourceType: e.sourceType }));
  }, []);
  const habits = useLiveQuery(
    () => db.habits.where("playerId").equals(PLAYER_ID).toArray(),
    []
  );

  const elapsed = elapsedDates(period);
  const elapsedSet = new Set(elapsed);

  // A day counts as "showed up" when any activity was logged or habit checked in.
  const activeDays = new Set<string>();
  for (const l of logDates ?? []) if (elapsedSet.has(l.date)) activeDays.add(l.date);
  for (const h of habits ?? [])
    for (const d of h.weeklyLog) if (elapsedSet.has(d)) activeDays.add(d);

  // Daily habit completions per bucket (from the activity log, which keeps full history).
  const completionsByDay = new Map<string, number>();
  for (const l of logDates ?? []) {
    if (l.sourceType === "habit" && elapsedSet.has(l.date)) {
      completionsByDay.set(l.date, (completionsByDay.get(l.date) ?? 0) + 1);
    }
  }

  const chartData =
    period === "week"
      ? elapsed.map((date, i) => ({
          label: WEEK_LABELS[i],
          completions: completionsByDay.get(date) ?? 0,
        }))
      : elapsed.map((date) => ({
          label: String(Number(date.slice(-2))),
          completions: completionsByDay.get(date) ?? 0,
        }));

  const habitsDoneThisPeriod = [...completionsByDay.values()].reduce((a, b) => a + b, 0);
  const daysShowedUp = activeDays.size;
  const currentStreak = Math.max(0, ...(habits ?? []).map((h) => h.streakCount));
  const hasAnyActivity = daysShowedUp > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Reflect</h1>
          <p className="mt-1 text-sm text-ink-500">
            A quiet look back — derived from your log, never edited by it.
          </p>
        </div>
        <Tabs<Period>
          items={[
            { value: "week", label: "This week" },
            { value: "month", label: "This month" },
          ]}
          value={period}
          onChange={setPeriod}
        />
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Panel>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-moss-600" />
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">
              Days showed up
            </p>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-ink-900">
            {daysShowedUp}/{elapsed.length}
          </p>
          <p className="mt-1 text-xs text-ink-400">
            {hasAnyActivity
              ? "Days with any check-in or logged activity."
              : "No days yet — any check-in counts."}
          </p>
        </Panel>

        <Panel>
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-gold-600" />
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">
              Habits completed
            </p>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-ink-900">{habitsDoneThisPeriod}</p>
          <p className="mt-1 text-xs text-ink-400">
            {habitsDoneThisPeriod > 0
              ? `Check-ins ${period === "week" ? "this week" : "this month"}.`
              : "No habit check-ins yet."}
          </p>
        </Panel>

        <Panel>
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-terra-500" />
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">
              Current streak
            </p>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-ink-900">{currentStreak}d</p>
          <p className="mt-1 text-xs text-ink-400">
            {currentStreak > 0 ? "Longest live habit streak." : "No active streaks yet."}
          </p>
        </Panel>
      </div>

      {/* Daily completions chart */}
      <Panel>
        <PanelTitle>Daily completions</PanelTitle>
        <p className="mt-1 text-xs text-ink-400">
          Habit check-ins per day, {period === "week" ? "Mon–Sun" : "day of month"}.
        </p>
        {logDates === undefined || habits === undefined ? null : !hasAnyActivity ? (
          <div className="mt-6 rounded-xl border border-dashed border-parchment-400 py-10 text-center">
            <p className="font-display font-semibold text-ink-500">
              A quiet {period}. Tomorrow is a fresh page.
            </p>
          </div>
        ) : (
          <div className="mt-4 h-56 w-full" aria-label="Bar chart of daily completions">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: "#c9bc9a" }}
                  tick={{ fill: "#6d6450", fontSize: 11, fontFamily: "var(--font-quicksand)", fontWeight: 700 }}
                  interval={period === "month" ? 2 : 0}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#6d6450", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(139,160,94,0.12)" }}
                  formatter={(v) => [`${v} check-in${v === 1 ? "" : "s"}`, null]}
                  contentStyle={{
                    background: "#faf6ea",
                    border: "1px solid #c9bc9a",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "#35301f",
                  }}
                />
                <Bar
                  dataKey="completions"
                  fill="#8ba05e"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={period === "month" ? 18 : 40}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      {/* Gentle footnote echoing the zero-state voice */}
      <p className={cn("text-center text-xs text-ink-300")}>
        Read-only mirror of your adventure — nothing here can change your data.
      </p>
    </div>
  );
}
