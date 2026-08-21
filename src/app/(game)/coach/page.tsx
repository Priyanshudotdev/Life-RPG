"use client";

import {
  Bot,
  CheckCircle2,
  Hammer,
  KeyRound,
  RefreshCw,
  Send,
  Sparkles,
  Wand2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel, PanelTitle } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/segmented-bar";
import { Tabs } from "@/components/ui/tabs";
import { RoadmapTab } from "@/components/roadmap-tab";
import { db, PLAYER_ID } from "@/lib/db";
import {
  applyPlan,
  generatePlan,
  getGeminiKey,
  getLatestPlan,
  refinePlan,
  reviewDay,
} from "@/lib/ai";
import type { AiReview } from "@/lib/types";

type TabValue = "debrief" | "plan" | "roadmap";

export default function CoachPage() {
  const [tab, setTab] = useState<TabValue>("debrief");
  const reviews = useLiveQuery(
    () =>
      db.aiReviews
        .where("playerId")
        .equals(PLAYER_ID)
        .reverse()
        .sortBy("createdAt"),
    []
  );
  const hasKey = getGeminiKey().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">AI Coach</h1>
        <p className="mt-1 text-sm text-ink-500">
          Your personal coach: daily debriefs that score your day, an AI-built
          plan you can reshape with a sentence, and roadmaps for anything you
          want to learn.
        </p>
      </div>

      <Tabs<TabValue>
        items={[
          { value: "debrief", label: "Daily debrief" },
          { value: "plan", label: "My plan" },
          { value: "roadmap", label: "Roadmap" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "roadmap" ? (
        <RoadmapTab />
      ) : !hasKey ? (
        <Panel>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gold-500 bg-gold-100">
              <KeyRound className="h-5 w-5 text-gold-600" />
            </span>
            <div>
              <PanelTitle>A Gemini API key is needed</PanelTitle>
              <p className="mt-2 text-sm text-ink-500">
                The Coach runs on Google&apos;s Gemini and talks to it straight
                from your browser — your key never leaves this device. Grab a
                free key from{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-moss-600 hover:underline"
                >
                  Google AI Studio
                </a>
                , then paste it in Settings.
              </p>
              <Link href="/settings" className="mt-3 inline-block">
                <Button size="sm">Open Settings</Button>
              </Link>
            </div>
          </div>
        </Panel>
      ) : tab === "debrief" ? (
        <DebriefTab reviews={reviews ?? []} />
      ) : (
        <PlanTab />
      )}
    </div>
  );
}

/* ── Daily debrief tab ────────────────────────────────────── */

function DebriefTab({ reviews }: { reviews: AiReview[] }) {
  const [journal, setJournal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof reviewDay>> | null>(null);

  async function run() {
    if (!journal.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await reviewDay(journal);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Panel>
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-plum-500" />
          <PanelTitle>Today&apos;s debrief</PanelTitle>
        </div>
        <textarea
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="How did today go? e.g. “Went for a morning run, finished the report draft, but scrolled way too much after lunch…”"
          className="mt-4 w-full resize-y rounded-xl border border-parchment-400 bg-parchment-50 px-3.5 py-3 text-sm leading-relaxed text-ink-800 placeholder:text-ink-300 focus:border-moss-500 focus:outline-none"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="font-mono text-xs text-ink-300">{journal.length}/2000</span>
          <Button onClick={() => void run()} disabled={!journal.trim() || busy}>
            <Bot className="h-4 w-4" />
            {busy ? "The Coach is pondering…" : "Review my day"}
          </Button>
        </div>
        {error && (
          <p className="mt-3 rounded-xl border border-terra-300 bg-terra-100/60 px-3 py-2 text-sm font-medium text-terra-700">
            {error}
          </p>
        )}
      </Panel>

      {result && <VerdictCard result={result} />}

      {reviews.length > 0 && (
        <Panel>
          <PanelTitle>Past debriefs</PanelTitle>
          <ul className="mt-4 space-y-4">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-parchment-300 bg-parchment-100/60 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-bold text-ink-400">{r.date}</span>
                  <span className="font-mono text-sm font-bold text-gold-700">
                    {r.score}/100
                  </span>
                </div>
                <ProgressBar pct={r.score} tone="gold" className="mt-2 h-2" />
                <p className="mt-3 text-sm leading-relaxed text-ink-700">{r.summary}</p>
                {r.habitsMatched.length > 0 && (
                  <p className="mt-2 flex flex-wrap gap-1.5">
                    {r.habitsMatched.map((h) => (
                      <span
                        key={h}
                        className="rounded-full border border-moss-400 bg-moss-100 px-2.5 py-0.5 text-[11px] font-semibold text-moss-700"
                      >
                        ✓ {h}
                      </span>
                    ))}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}

function VerdictCard({ result }: { result: Awaited<ReturnType<typeof reviewDay>> }) {
  const { review, checkedIn, skipped } = result;
  return (
    <Panel className="border-moss-300">
      <div className="flex items-center justify-between gap-3">
        <PanelTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold-500" /> The Coach&apos;s verdict
        </PanelTitle>
        <span className="font-mono text-2xl font-bold text-gold-700">
          {review.score}
          <span className="text-sm text-ink-400">/100</span>
        </span>
      </div>
      <ProgressBar pct={review.score} tone="gold" className="mt-3 h-3" />
      <p className="mt-4 text-sm leading-relaxed text-ink-700">{review.summary}</p>

      {checkedIn.length > 0 && (
        <div className="mt-4 rounded-xl border border-moss-300 bg-moss-50 p-3">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-moss-600">
            Checked in for you
          </p>
          <ul className="mt-1.5 space-y-1">
            {checkedIn.map((c) => (
              <li key={c.name} className="flex items-center gap-2 text-sm text-ink-700">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-moss-500" />
                {c.name}
                <span className="ml-auto shrink-0 font-mono text-xs text-moss-600">
                  +{c.xp} XP · +{c.coins} coins
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {skipped.length > 0 && (
        <ul className="mt-2 space-y-1">
          {skipped.map((s) => (
            <li key={s.name} className="flex items-center gap-2 text-xs text-ink-400">
              <XCircle className="h-3.5 w-3.5 shrink-0 text-terra-400" />
              {s.name} — {s.reason}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-moss-300 bg-moss-50 p-3">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-moss-600">
            Wins
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {review.wins.map((w, i) => (
              <li key={i} className="text-sm text-ink-700">• {w}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-terra-300 bg-terra-100/60 p-3">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-terra-600">
            Improve tomorrow
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {review.improvements.map((w, i) => (
              <li key={i} className="text-sm text-ink-700">• {w}</li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

/* ── Plan tab ─────────────────────────────────────────────── */

function PlanTab() {
  // null = loaded, no plan yet · undefined = still querying
  const plan = useLiveQuery(async () => (await getLatestPlan()) ?? null, []);
  const [busy, setBusy] = useState<"generate" | "refine" | "apply" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [feedback, setFeedback] = useState("");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const autoTried = useRef(false);

  // Auto-generate on first visit when there's no plan yet.
  useEffect(() => {
    if (autoTried.current || plan !== null || busy) return;
    autoTried.current = true;
    void runGenerate();
  }, [plan, busy]);

  async function runGenerate() {
    setBusy("generate");
    setError("");
    setNotice("");
    try {
      await generatePlan();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function runRefine() {
    if (!feedback.trim() || busy) return;
    setBusy("refine");
    setError("");
    setNotice("");
    try {
      await refinePlan(feedback);
      setFeedback("");
      setExcluded(new Set());
      setNotice("The Coach revised your plan — review it below.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function runApply() {
    if (!plan || busy) return;
    const ids = plan.items.filter((i) => !excluded.has(i.id)).map((i) => i.id);
    if (ids.length === 0) return;
    setBusy("apply");
    setError("");
    try {
      const { habits, projects } = await applyPlan(ids);
      setNotice(`Applied! ${habits} habit(s) and ${projects} project(s) added.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  function toggle(id: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (plan === undefined || busy === "generate") {
    return (
      <Panel>
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <Bot className="h-8 w-8 animate-pulse text-plum-400" />
          <p className="mt-4 font-display text-lg font-semibold text-ink-700">
            The Coach is drafting your plan…
          </p>
          <p className="mt-1 text-sm text-ink-400">
            Reading your targets, skills, and weaknesses.
          </p>
        </div>
      </Panel>
    );
  }

  if (plan === null) {
    return (
      <Panel>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Wand2 className="h-8 w-8 text-plum-400" />
          <p className="mt-4 font-display text-lg font-semibold text-ink-700">
            No plan yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-ink-400">
            The Coach can build one from your targets — habits to build and
            quests to finish.
          </p>
          <Button className="mt-4" onClick={() => void runGenerate()}>
            <Wand2 className="h-4 w-4" /> Generate my plan
          </Button>
          {error && <ErrorNote error={error} />}
        </div>
      </Panel>
    );
  }

  const selectedCount = plan.items.filter((i) => !excluded.has(i.id)).length;

  return (
    <>
      <Panel className={plan.appliedAt ? "" : "border-moss-300"}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <PanelTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold-500" /> The Coach&apos;s plan
          </PanelTitle>
          <div className="flex items-center gap-2">
            {plan.appliedAt ? (
              <span className="rounded-full border border-moss-400 bg-moss-100 px-2.5 py-0.5 text-[11px] font-semibold text-moss-700">
                Applied
              </span>
            ) : (
              <Button size="sm" onClick={() => void runApply()} disabled={selectedCount === 0 || busy !== null}>
                <CheckCircle2 className="h-4 w-4" /> Apply {selectedCount} item{selectedCount === 1 ? "" : "s"}
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => void runGenerate()} disabled={busy !== null}>
              <RefreshCw className="h-4 w-4" /> New plan
            </Button>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-ink-700">{plan.strategy}</p>

        {!plan.appliedAt && (
          <p className="mt-2 text-xs text-ink-400">
            Uncheck anything you don&apos;t want before applying.
          </p>
        )}

        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {plan.items.map((item) => {
            const checked = !excluded.has(item.id);
            const disabled = !!plan.appliedAt;
            return (
              <li key={item.id}>
                <label
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-all ${
                    checked
                      ? "border-parchment-400 bg-parchment-50"
                      : "border-parchment-300 bg-parchment-100/40 opacity-55"
                  } ${disabled ? "pointer-events-none" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(item.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-moss-600"
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      {item.kind === "project" ? (
                        <Hammer className="h-3.5 w-3.5 shrink-0 text-plum-500" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-moss-500" />
                      )}
                      <span className="truncate font-display text-sm font-bold text-ink-800">
                        {item.name}
                      </span>
                      <span className="shrink-0 rounded-full border border-parchment-400 bg-parchment-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-400">
                        {item.kind}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-ink-500">
                      {item.detail}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        {(notice || error) && (
          <div className="mt-4">
            {notice && (
              <p className="rounded-xl border border-moss-300 bg-moss-50 px-3 py-2 text-sm font-medium text-moss-700">
                {notice}
              </p>
            )}
            {error && <ErrorNote error={error} />}
          </div>
        )}
      </Panel>

      <Panel>
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-plum-500" />
          <PanelTitle>Change it with AI</PanelTitle>
        </div>
        <p className="mt-2 text-sm text-ink-500">
          Tell the Coach what to tweak — e.g. &ldquo;I can&apos;t do mornings,
          shift runs to evening&rdquo; or &ldquo;make it easier for this
          week&rdquo;.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void runRefine();
            }}
            maxLength={300}
            placeholder="e.g. Add something for my writing target…"
            className="min-w-0 flex-1 rounded-xl border border-parchment-400 bg-parchment-50 px-3 py-2.5 text-sm text-ink-800 placeholder:text-ink-300 focus:border-moss-500 focus:outline-none"
          />
          <Button onClick={() => void runRefine()} disabled={!feedback.trim() || busy !== null} className="shrink-0">
            <Send className="h-4 w-4" />
            {busy === "refine" ? "Revising…" : "Revise plan"}
          </Button>
        </div>
      </Panel>
    </>
  );
}

function ErrorNote({ error }: { error: string }) {
  return (
    <p className="rounded-xl border border-terra-300 bg-terra-100/60 px-3 py-2 text-sm font-medium text-terra-700">
      {error}
    </p>
  );
}
