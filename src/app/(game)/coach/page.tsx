"use client";

import { Bot, CheckCircle2, KeyRound, Sparkles, Wand2, XCircle } from "lucide-react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel, PanelTitle } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/segmented-bar";
import { db, PLAYER_ID } from "@/lib/db";
import { getGeminiKey, reviewDay } from "@/lib/ai";

export default function CoachPage() {
  const reviews = useLiveQuery(
    () =>
      db.aiReviews.where("playerId").equals(PLAYER_ID).reverse().sortBy("createdAt"),
    []
  );
  const hasKey = getGeminiKey().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">AI Coach</h1>
        <p className="mt-1 text-sm text-ink-500">
          Tell the Coach how your day went — it scores the day, checks in your
          habits for you, and tells you what to sharpen tomorrow.
        </p>
      </div>

      {!hasKey ? (
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
      ) : (
        <DebriefForm />
      )}

      {reviews && reviews.length > 0 && (
        <Panel>
          <PanelTitle>Past debriefs</PanelTitle>
          <ul className="mt-4 space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl border border-parchment-300 bg-parchment-100/60 p-4">
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
    </div>
  );
}

function DebriefForm() {
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
