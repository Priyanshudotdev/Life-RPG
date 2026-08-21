"use client";

import { CalendarCheck, Flame, Hammer, Lock, Plus, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { CharacterSheet } from "@/components/character-sheet";
import { SkillRadar } from "@/components/skill-radar";
import { Button } from "@/components/ui/button";
import { Panel, PanelTitle } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/segmented-bar";
import { db, PLAYER_ID } from "@/lib/db";
import { addTarget } from "@/lib/game";
import { useGame } from "@/lib/store";
import { todayISO } from "@/lib/utils";

export default function DashboardPage() {
  const { player, skills } = useGame();
  const habits = useLiveQuery(
    () => db.habits.where("playerId").equals(PLAYER_ID).toArray(),
    []
  );
  const projects = useLiveQuery(
    () => db.projects.where("playerId").equals(PLAYER_ID).toArray(),
    []
  );

  if (!player) return null;

  const today = todayISO();
  const habitsDoneToday = (habits ?? []).filter((h) => h.lastCheckInDate === today).length;
  const activeProjects = (projects ?? []).filter((p) => p.status !== "done");
  const doneProjects = (projects ?? []).filter((p) => p.status === "done");

  // Goal completion: average of habit consistency today + project progress.
  const habitPct = habits && habits.length > 0 ? (habitsDoneToday / habits.length) * 100 : 0;
  const projectPct =
    activeProjects.length > 0
      ? activeProjects.reduce((sum, p) => sum + p.progressPct, 0) / activeProjects.length
      : 0;
  const goalPct = Math.round((habitPct + projectPct) / 2);

  const bestStreak = Math.max(0, ...(habits ?? []).map((h) => h.streakCount));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <CharacterSheet player={player} />

        <div className="space-y-6">
          <Panel>
            <div className="flex items-center justify-between">
              <PanelTitle>Skill Constellation</PanelTitle>
              <Link
                href="/skills"
                className="font-display text-xs font-bold text-moss-600 hover:underline"
              >
                View all →
              </Link>
            </div>
            <SkillRadar skills={skills} />
          </Panel>

          <Panel>
            <div className="flex items-center justify-between">
              <PanelTitle>Goal Completion</PanelTitle>
              <span className="font-mono text-sm font-bold text-gold-600">{goalPct}%</span>
            </div>
            <ProgressBar pct={goalPct} tone="gold" className="mt-3 h-3" />
            <p className="mt-2 text-xs text-ink-400">
              Blends today&apos;s habit check-ins with in-flight project progress.
            </p>
          </Panel>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<CalendarCheck className="h-4 w-4 text-moss-600" />}
          label="Habits today"
          value={`${habitsDoneToday}/${habits?.length ?? 0}`}
          href="/habits"
        />
        <StatCard
          icon={<Flame className="h-4 w-4 text-terra-500" />}
          label="Best streak"
          value={`${bestStreak}d`}
          href="/habits"
        />
        <StatCard
          icon={<Hammer className="h-4 w-4 text-plum-500" />}
          label="Active quests"
          value={String(activeProjects.length)}
          href="/projects"
        />
        <StatCard
          icon={<Target className="h-4 w-4 text-gold-600" />}
          label="Stages cleared"
          value={String(doneProjects.length)}
          href="/projects"
        />
      </div>

      {/* Targets — append-only by design */}
      <TargetsPanel targets={player.targets ?? []} />
    </div>
  );
}

function TargetsPanel({ targets }: { targets: { id: string; text: string; createdAt: number }[] }) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  const submit = async () => {
    if (!draft.trim() || adding) return;
    setAdding(true);
    try {
      await addTarget(draft);
      setDraft("");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Panel>
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-moss-500" />
        <PanelTitle>Targets</PanelTitle>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-parchment-400 bg-parchment-100 px-2.5 py-0.5 text-[11px] font-medium text-ink-400">
          <Lock className="h-3 w-3" /> Written in ink — can&apos;t be edited or removed
        </span>
      </div>

      <ol className="mt-4 space-y-2">
        {targets.map((t, i) => (
          <li
            key={t.id}
            className="flex items-baseline gap-3 rounded-xl border border-parchment-300 bg-parchment-100/60 px-4 py-3"
          >
            <span className="shrink-0 font-mono text-xs font-bold text-moss-500">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-display font-semibold text-ink-800">{t.text}</span>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          maxLength={80}
          placeholder="Add a new target — e.g. Read 12 books this year…"
          className="min-w-0 flex-1 rounded-xl border border-parchment-400 bg-parchment-50 px-3 py-2.5 text-sm text-ink-800 placeholder:text-ink-300 focus:border-moss-500 focus:outline-none"
        />
        <Button onClick={() => void submit()} disabled={!draft.trim() || adding} className="shrink-0">
          <Plus className="h-4 w-4" /> Add target
        </Button>
      </div>
    </Panel>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Panel className="transition-all hover:-translate-y-0.5 hover:shadow-lift">
        <div className="flex items-center gap-2">
          {icon}
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">
            {label}
          </p>
        </div>
        <p className="mt-2 font-mono text-2xl font-bold text-ink-900">{value}</p>
      </Panel>
    </Link>
  );
}
