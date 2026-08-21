"use client";

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Hammer,
  Lock,
  Map,
  Play,
  Plus,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel, PanelTitle } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/segmented-bar";
import { db, PLAYER_ID } from "@/lib/db";
import {
  completeMilestone,
  createJourney,
  generateRoadmap,
  groupMilestones,
  integrateMilestone,
  type MilestoneDraft,
} from "@/lib/journey";
import { cn } from "@/lib/utils";

interface DraftRow extends MilestoneDraft {
  key: string;
}

const emptyRow = (): DraftRow => ({ key: crypto.randomUUID(), title: "", description: "" });

export function RoadmapTab() {
  const journeys = useLiveQuery(
    () => db.journeys.where("playerId").equals(PLAYER_ID).sortBy("createdAt"),
    []
  );
  const milestones = useLiveQuery(
    () => db.journeyMilestones.toArray(),
    []
  );
  const skills = useLiveQuery(
    () => db.skills.where("playerId").equals(PLAYER_ID).toArray(),
    []
  );

  // Create form state
  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [linkSkillId, setLinkSkillId] = useState("");
  const [busy, setBusy] = useState<"ai" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [rows, setRows] = useState<DraftRow[]>([emptyRow(), emptyRow()]);

  const grouped = groupMilestones(milestones ?? []);
  const sorted = [...(journeys ?? [])].reverse(); // newest first

  function resetForm() {
    setGoal("");
    setContext("");
    setLinkSkillId("");
    setManualOpen(false);
    setRows([emptyRow(), emptyRow()]);
    setError("");
  }

  async function runGenerate() {
    if (!goal.trim() || busy) return;
    setBusy("ai");
    setError("");
    setNotice("");
    try {
      const drafts = await generateRoadmap(goal, context);
      await createJourney(goal, context, drafts, linkSkillId || null);
      resetForm();
      setNotice(`Roadmap created — ${drafts.length} milestones mapped.`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong."
      );
      setManualOpen(true); // graceful fallback: never block the feature
    } finally {
      setBusy(null);
    }
  }

  async function beginManual() {
    if (busy) return;
    setError("");
    try {
      const drafts = rows
        .filter((r) => r.title.trim())
        .map(({ title, description }) => ({ title, description }));
      await createJourney(goal.trim() || "My new journey", context, drafts, linkSkillId || null);
      resetForm();
      setNotice(`Roadmap created — ${drafts.length} milestone${drafts.length === 1 ? "" : "s"} mapped.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  function moveRow(i: number, dir: -1 | 1) {
    setRows((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <>
      {/* ── Create a roadmap ── */}
      <Panel>
        <div className="flex items-center gap-2">
          <Map className="h-4 w-4 text-plum-500" />
          <PanelTitle>New roadmap</PanelTitle>
        </div>
        <p className="mt-2 text-sm text-ink-500">
          Name anything you want to learn or achieve — the Coach maps it into
          ordered milestones you can pull into your habits and quests.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            maxLength={80}
            placeholder="e.g. Learn DSA · Run a half marathon · Write a novel"
            className="w-full rounded-xl border border-parchment-400 bg-parchment-50 px-3 py-2.5 text-sm text-ink-800 placeholder:text-ink-300 focus:border-moss-500 focus:outline-none"
          />
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            maxLength={200}
            placeholder="Optional context — e.g. I know basic JS, 5 hours a week…"
            className="w-full rounded-xl border border-parchment-400 bg-parchment-50 px-3 py-2.5 text-sm text-ink-800 placeholder:text-ink-300 focus:border-moss-500 focus:outline-none"
          />
          <select
            value={linkSkillId}
            onChange={(e) => setLinkSkillId(e.target.value)}
            className="w-full rounded-xl border border-parchment-400 bg-parchment-50 px-3 py-2.5 text-sm text-ink-700 focus:border-moss-500 focus:outline-none"
            aria-label="Link a skill to grant XP to"
          >
            <option value="">No skill link (optional)</option>
            {(skills ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                Grant XP to {s.name} (Lv. {s.level})
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => void runGenerate()} disabled={!goal.trim() || busy !== null}>
            <Sparkles className="h-4 w-4" />
            {busy === "ai" ? "Charting the path…" : "Generate roadmap"}
          </Button>
          {!manualOpen && (
            <Button variant="secondary" onClick={() => { setManualOpen(true); setError(""); }}>
              <Plus className="h-4 w-4" /> Build manually
            </Button>
          )}
        </div>

        {manualOpen && (
          <div className="mt-4 rounded-xl border border-parchment-400 bg-parchment-100/60 p-3">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">
              Manual builder — add, reorder, remove
            </p>
            <ul className="mt-2 space-y-2">
              {rows.map((row, i) => (
                <li key={row.key} className="flex items-start gap-2 rounded-xl border border-parchment-300 bg-parchment-50 p-2">
                  <span className="mt-2 shrink-0 font-mono text-xs font-bold text-moss-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 space-y-1.5">
                    <input
                      value={row.title}
                      onChange={(e) =>
                        setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, title: e.target.value } : r)))
                      }
                      maxLength={60}
                      placeholder={`Milestone ${i + 1} title`}
                      className="w-full rounded-lg border border-parchment-400 bg-white/60 px-2.5 py-1.5 text-sm text-ink-800 placeholder:text-ink-300 focus:border-moss-500 focus:outline-none"
                    />
                    <input
                      value={row.description}
                      onChange={(e) =>
                        setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, description: e.target.value } : r)))
                      }
                      maxLength={200}
                      placeholder="One line on what doing it looks like (optional)"
                      className="w-full rounded-lg border border-parchment-300 bg-white/40 px-2.5 py-1.5 text-xs text-ink-600 placeholder:text-ink-300 focus:border-moss-500 focus:outline-none"
                    />
                  </span>
                  <span className="flex shrink-0 flex-col gap-0.5 pt-0.5">
                    <button
                      type="button"
                      aria-label="Move up"
                      onClick={() => moveRow(i, -1)}
                      disabled={i === 0}
                      className="grid h-6 w-6 place-items-center rounded-md text-ink-400 hover:bg-parchment-200 disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      onClick={() => moveRow(i, 1)}
                      disabled={i === rows.length - 1}
                      className="grid h-6 w-6 place-items-center rounded-md text-ink-400 hover:bg-parchment-200 disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </span>
                  <button
                    type="button"
                    aria-label="Remove milestone"
                    onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md text-terra-500 hover:bg-terra-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setRows((prev) => [...prev, emptyRow()])}>
                <Plus className="h-3.5 w-3.5" /> Add milestone
              </Button>
              <Button size="sm" onClick={() => void beginManual()} disabled={!rows.some((r) => r.title.trim())}>
                Begin journey
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setManualOpen(false); setRows([emptyRow(), emptyRow()]); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {notice && (
          <p className="mt-3 rounded-xl border border-moss-300 bg-moss-50 px-3 py-2 text-sm font-medium text-moss-700">
            {notice}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-xl border border-terra-300 bg-terra-100/60 px-3 py-2 text-sm font-medium text-terra-700">
            {error}
          </p>
        )}
      </Panel>

      {/* ── Existing journeys ── */}
      {journeys !== undefined && journeys.length === 0 && (
        <Panel className="py-10 text-center">
          <Map className="mx-auto h-8 w-8 text-plum-300" />
          <p className="mt-3 font-display font-semibold text-ink-500">No roadmaps yet.</p>
          <p className="mt-1 text-sm text-ink-400">
            Every long journey becomes a string of small, checkable steps.
          </p>
        </Panel>
      )}

      {sorted.map((j) => (
        <JourneyCard key={j.id} journey={j} milestones={grouped[j.id] ?? []} />
      ))}
    </>
  );
}

/* ── One journey: summary header + vertical path ─────────── */

function JourneyCard({
  journey,
  milestones,
}: {
  journey: import("@/lib/types").Journey;
  milestones: import("@/lib/types").JourneyMilestone[];
}) {
  const [flash, setFlash] = useState("");
  const done = milestones.filter((m) => m.status === "completed").length;
  const total = milestones.length;
  const currentIdx = milestones.findIndex((m) => m.status === "current");
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  async function markReached(id: string) {
    const r = await completeMilestone(id);
    if (r.ok && r.journeyCompleted) setFlash("Journey complete! Rewards granted.");
    else if (!r.ok) setFlash(r.reason);
  }

  async function integrate(id: string, as: "habit" | "project") {
    const r = await integrateMilestone(id, as);
    setFlash(
      r.ok
        ? r.as === "habit"
          ? `“${r.name}” added to your habits.`
          : `“${r.name}” added to your quest board.`
        : r.reason
    );
  }

  return (
    <Panel className={journey.status === "completed" ? "border-gold-400" : ""}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <PanelTitle className="flex items-center gap-2">
            <Map className="h-4 w-4 text-plum-500" /> {journey.title}
          </PanelTitle>
          {journey.description && (
            <p className="mt-1 text-sm text-ink-500">{journey.description}</p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
            journey.status === "completed"
              ? "border-gold-500 bg-gold-100 text-gold-700"
              : "border-moss-400 bg-moss-100 text-moss-700"
          )}
        >
          {journey.status === "completed" ? "Complete" : "Active"}
        </span>
      </div>

      {journey.status === "completed" && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-gold-500 bg-gold-100 px-3 py-2.5">
          <Trophy className="h-4 w-4 shrink-0 text-gold-600" />
          <p className="font-display text-sm font-bold text-gold-700">
            Journey Complete — every milestone reached.
          </p>
        </div>
      )}

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-display font-bold uppercase tracking-[0.12em] text-ink-400">
            {journey.status === "completed"
              ? `${done}/${total} milestones`
              : currentIdx >= 0
                ? `Stage ${currentIdx + 1} of ${total}`
                : `${done}/${total} milestones`}
          </span>
          <span className="font-mono font-bold text-moss-600">{pct}%</span>
        </div>
        <ProgressBar pct={pct} tone="moss" className="mt-1.5 h-2.5" />
      </div>

      <ol className="mt-4 space-y-2.5">
        {milestones.map((m, i) => {
          const isCurrent = m.status === "current";
          const isDone = m.status === "completed";
          return (
            <li
              key={m.id}
              className={cn(
                "rounded-xl border p-3 transition-all",
                isDone && "border-parchment-300 bg-parchment-100/40 opacity-70",
                isCurrent && "border-moss-500 bg-moss-50 shadow-panel",
                m.status === "locked" && "border-parchment-300 bg-parchment-50 opacity-60"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg border font-mono text-xs font-bold",
                    isDone && "border-moss-500 bg-moss-500 text-parchment-50",
                    isCurrent && "border-moss-500 bg-white text-moss-600",
                    m.status === "locked" && "border-parchment-400 bg-parchment-100 text-ink-300"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "font-display text-sm font-bold",
                      isCurrent ? "text-ink-900" : isDone ? "text-ink-500 line-through" : "text-ink-600"
                    )}
                  >
                    {i + 1}. {m.title}
                  </p>
                  {m.description && (
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{m.description}</p>
                  )}
                  <p className="mt-1 font-mono text-[11px] text-ink-300">
                    +{m.xpReward} XP{journey.skillId ? "" : " (needs skill link)"} · +{m.coinReward} coins
                  </p>

                  {isCurrent && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <Button size="sm" onClick={() => void markReached(m.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark reached
                      </Button>
                      {!m.integratedAs && (
                        <>
                          <span className="text-xs text-ink-400">Bring into your loop:</span>
                          <Button size="sm" variant="secondary" onClick={() => void integrate(m.id, "habit")}>
                            As habit
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => void integrate(m.id, "project")}>
                            <Hammer className="h-3.5 w-3.5" /> As quest
                          </Button>
                        </>
                      )}
                      {m.integratedAs && (
                        <span className="rounded-full border border-moss-400 bg-moss-100 px-2.5 py-0.5 text-[11px] font-semibold text-moss-700">
                          In {m.integratedAs === "habit" ? "habits" : "quests"} ✓
                        </span>
                      )}
                    </div>
                  )}
                  {isDone && m.integratedAs && (
                    <span className="mt-1.5 inline-block rounded-full border border-parchment-400 bg-parchment-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-400">
                      was in {m.integratedAs === "habit" ? "habits" : "quests"}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {flash && <p className="mt-3 text-xs font-medium text-moss-600">{flash}</p>}
    </Panel>
  );
}
