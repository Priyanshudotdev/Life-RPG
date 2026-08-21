import { db, PLAYER_ID } from "./db";
import { checkInHabit } from "./game";
import type { ActivityLogEntry, AiReview, Habit, Player, Skill } from "./types";
import { todayISO } from "./utils";

/* ── Gemini API key (stored locally only — this app has no server) ── */
const KEY_STORAGE = "life-rpg.gemini-api-key";

export function getGeminiKey(): string {
  try {
    return window.localStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function setGeminiKey(key: string): void {
  window.localStorage.setItem(KEY_STORAGE, key.trim());
}

export function clearGeminiKey(): void {
  window.localStorage.removeItem(KEY_STORAGE);
}

const GEMINI_MODEL = "gemini-2.5-flash";

/* ── Structured output contract ───────────────────────────── */
interface CoachVerdict {
  dailyScore: number;
  summary: string;
  wins: string[];
  improvements: string[];
  habitsCompleted: string[];
}

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    dailyScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description:
        "Overall score for the day, 0-100. 50 is an ordinary day; going above requires real effort.",
    },
    summary: {
      type: "string",
      description: "Two or three warm, coach-like sentences about the day.",
    },
    wins: {
      type: "array",
      items: { type: "string" },
      description: "1-4 concrete things that went well today.",
    },
    improvements: {
      type: "array",
      items: { type: "string" },
      description:
        "1-3 specific, actionable suggestions for tomorrow. Not generic advice.",
    },
    habitsCompleted: {
      type: "array",
      items: { type: "string" },
      description:
        "Exact names (from the provided habit list) of habits the journal clearly evidences as done today. Empty if none.",
    },
  },
  required: [
    "dailyScore",
    "summary",
    "wins",
    "improvements",
    "habitsCompleted",
  ],
} as const;

function buildPrompt(
  player: Player,
  skills: Skill[],
  habits: Habit[],
  recentLog: ActivityLogEntry[],
  journal: string
): string {
  const habitLines =
    habits.length > 0
      ? habits
          .map(
            (h) =>
              `- ${h.name}${h.lastCheckInDate === todayISO() ? " (already checked in today)" : ""}`
          )
          .join("\n")
      : "- (no habits defined yet)";
  const skillLines =
    skills.map((s) => `- ${s.name}: Lv. ${s.level} (${s.rank})`).join("\n") ||
    "- (none)";
  const logLines =
    recentLog
      .slice(0, 12)
      .map((l) => `- ${l.message}`)
      .join("\n") || "- (quiet so far)";
  const targetLines =
    player.targets.map((t) => `- ${t.text}`).join("\n") || "- (none set)";

  return `You are the Coach in "Life RPG", a cozy life-gamification app. The player just told you how their day went. Your job:

1. Score the day from 0 to 100.
2. Write a short, warm but honest summary.
3. List concrete wins and specific improvements for tomorrow.
4. Decide which of the player's tracked habits the journal clearly evidences as completed TODAY. Only include habits with clear evidence — when unsure, leave it out.

Player: ${player.name}, overall Lv. ${player.level}, ${player.coins} coins.
Targets (long-term goals):
${targetLines}
Tracked skills:
${skillLines}
Tracked habits (candidates for habitsCompleted):
${habitLines}
Recent activity log:
${logLines}

Today is ${todayISO()}. The player's journal:
"""
${journal.trim()}
"""`;
}

async function callGemini(prompt: string, apiKey: string): Promise<CoachVerdict> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: VERDICT_SCHEMA,
        },
      }),
    }
  );

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.error?.message ?? detail;
    } catch {}
    throw new Error(`Gemini request failed: ${detail}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned an empty response.");
  const verdict = JSON.parse(text) as CoachVerdict;
  verdict.dailyScore = Math.max(0, Math.min(100, Math.round(verdict.dailyScore)));
  return verdict;
}

function matchHabit(name: string, habits: Habit[]): Habit | undefined {
  const needle = name.toLowerCase().trim();
  return (
    habits.find((h) => h.name.toLowerCase() === needle) ??
    habits.find(
      (h) =>
        h.name.toLowerCase().includes(needle) || needle.includes(h.name.toLowerCase())
    )
  );
}

export interface ReviewResult {
  review: AiReview;
  checkedIn: Array<{ name: string; xp: number; coins: number }>;
  skipped: Array<{ name: string; reason: string }>;
}

/**
 * Runs the AI daily debrief: asks Gemini to score the day, then auto
 * checks in any evidenced habits and stores the review locally.
 */
export async function reviewDay(journal: string): Promise<ReviewResult> {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("Add your Gemini API key in Settings first.");
  if (!journal.trim()) throw new Error("Write a few lines about your day first.");

  const player = await db.players.get(PLAYER_ID);
  if (!player) throw new Error("No character found.");

  const [skills, habits, recentLog] = await Promise.all([
    db.skills.where("playerId").equals(PLAYER_ID).toArray(),
    db.habits.where("playerId").equals(PLAYER_ID).toArray(),
    db.activityLog.where("playerId").equals(PLAYER_ID).reverse().sortBy("timestamp"),
  ]);

  const verdict = await callGemini(buildPrompt(player, skills, habits, recentLog, journal), apiKey);

  // Auto check-in evidenced habits (skip ones already done today).
  const checkedIn: ReviewResult["checkedIn"] = [];
  const skipped: ReviewResult["skipped"] = [];
  for (const name of verdict.habitsCompleted ?? []) {
    const habit = matchHabit(name, habits);
    if (!habit) {
      skipped.push({ name, reason: "no matching habit" });
      continue;
    }
    const result = await checkInHabit(habit.id);
    if (result.ok) {
      checkedIn.push({ name: habit.name, xp: result.xp, coins: result.coins });
    } else {
      skipped.push({ name: habit.name, reason: result.reason });
    }
  }

  const review: AiReview = {
    id: crypto.randomUUID(),
    playerId: PLAYER_ID,
    date: todayISO(),
    score: verdict.dailyScore,
    summary: verdict.summary,
    wins: verdict.wins ?? [],
    improvements: verdict.improvements ?? [],
    habitsMatched: checkedIn.map((c) => c.name),
    journalText: journal.trim(),
    createdAt: Date.now(),
  };
  await db.aiReviews.add(review);
  await db.activityLog.add({
    id: crypto.randomUUID(),
    playerId: PLAYER_ID,
    timestamp: Date.now(),
    message: `The Coach reviewed the day — scored it ${review.score}/100.`,
    xpGained: 0,
    coinsGained: 0,
    sourceType: "system",
  });

  return { review, checkedIn, skipped };
}
