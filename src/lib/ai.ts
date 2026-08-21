import { db, PLAYER_ID } from "./db";
import { addHabit, addProject, checkInHabit, HABIT_ICONS } from "./game";
import type {
  ActivityLogEntry,
  AiPlan,
  AiReview,
  Habit,
  PlanItem,
  Player,
  Project,
  Skill,
} from "./types";
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

export const GEMINI_MODEL = "gemini-3.6-flash";

/**
 * Ordered Gemini models tried for every structured request: when one is
 * deprecated, rate-limited, or unavailable on the account, the next is
 * attempted automatically so AI features never hard-fail on a model swap.
 */
const GEMINI_FALLBACK_MODELS = [
  GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
];

function structuredBody(prompt: string, schema: object) {
  return {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  };
}

async function extractError(res: Response): Promise<string> {
  let detail = `HTTP ${res.status}`;
  try {
    const body = await res.json();
    detail = body?.error?.message ?? detail;
  } catch {}
  return detail;
}

/**
 * POSTs a JSON-schema request to Gemini, walking the fallback model list on
 * failure. Key problems abort immediately (retrying other models can't help);
 * everything else — model removed, 404, 429, 5xx — moves to the next model.
 */
export async function requestStructured(
  prompt: string,
  schema: object,
  apiKey: string
): Promise<string> {
  const body = JSON.stringify(structuredBody(prompt, schema));
  let lastError = new Error("No Gemini models available.");

  for (const model of GEMINI_FALLBACK_MODELS) {
    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body,
        }
      );
    } catch (e) {
      // Network hiccup — worth trying the next endpoint, but keep the cause.
      lastError = e instanceof Error ? e : new Error("Network error.");
      continue;
    }

    if (!res.ok) {
      const detail = await extractError(res);
      if (/api key/i.test(detail)) {
        throw new Error(`Gemini request failed: ${detail}`);
      }
      lastError = new Error(`Gemini request failed (${model}): ${detail}`);
      continue;
    }

    const data = await res.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text;
    lastError = new Error("Gemini returned an empty response.");
  }

  throw lastError;
}

async function callGemini(prompt: string, apiKey: string): Promise<CoachVerdict> {
  const text = await requestStructured(prompt, VERDICT_SCHEMA, apiKey);
  const verdict = JSON.parse(text) as CoachVerdict;
  verdict.dailyScore = Math.max(0, Math.min(100, Math.round(verdict.dailyScore)));
  return verdict;
}

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

/* ── AI plan generation & refinement ──────────────────────── */

interface PlanVerdict {
  strategy: string;
  habits: Array<{ name: string; icon: string; why: string }>;
  projects: Array<{ name: string; why: string }>;
}

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    strategy: {
      type: "string",
      description:
        "Two or three sentences explaining the overall approach of the plan.",
    },
    habits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Short habit name, e.g. 'Morning run'. Max 40 chars.",
          },
          icon: {
            type: "string",
            enum: [...HABIT_ICONS],
            description: "Icon key for the habit.",
          },
          why: {
            type: "string",
            description: "One sentence on how this habit serves the targets.",
          },
        },
        required: ["name", "icon", "why"],
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "A concrete, finishable quest that moves a target forward. Max 60 chars.",
          },
          why: {
            type: "string",
            description: "One sentence on how this project serves the targets.",
          },
        },
        required: ["name", "why"],
      },
    },
  },
  required: ["strategy", "habits", "projects"],
} as const;

function buildPlanPrompt(
  player: Player,
  skills: Skill[],
  habits: Habit[],
  projects: Project[]
): string {
  const targetLines =
    player.targets.map((t, i) => `${i + 1}. ${t.text}`).join("\n") ||
    "- (none set)";
  const skillLines =
    skills.map((s) => `- ${s.name}: Lv. ${s.level}`).join("\n") || "- (none)";
  const strengthLines =
    player.strengths.map((s) => `- ${s}`).join("\n") || "- (none listed)";
  const weakLines =
    player.weaknesses.map((w) => `- ${w}`).join("\n") || "- (none listed)";
  const habitLines =
    habits.map((h) => `- ${h.name}`).join("\n") || "- (none yet)";
  const projectLines =
    projects
      .map((p) => `- ${p.name} (${p.status}${p.status !== "done" ? `, ${p.progressPct}%` : ""})`)
      .join("\n") || "- (none yet)";

  return `You are the Coach in "Life RPG", a cozy life-gamification app. Design an action plan for this player.

Player: ${player.name}, overall Lv. ${player.level}.
Their targets (long-term goals — the plan MUST serve these):
${targetLines}
Skills they train:
${skillLines}
Self-described strengths:
${strengthLines}
Self-described weaknesses (design around these):
${weakLines}
Habits they already track (do NOT duplicate these):
${habitLines}
Projects already on their board (do NOT duplicate):
${projectLines}

Rules:
- Propose 2-4 NEW daily/weekly habits and 1-3 concrete finishable projects.
- Every item must clearly serve at least one target.
- Keep it realistic for someone with the weaknesses above — start small.
`;
}

async function requestPlan(prompt: string, apiKey: string): Promise<PlanVerdict> {
  const text = await requestStructured(prompt, PLAN_SCHEMA, apiKey);
  return JSON.parse(text) as PlanVerdict;
}

function verdictToPlan(verdict: PlanVerdict): AiPlan {
  const items: PlanItem[] = [
    ...(verdict.habits ?? []).map((h) => ({
      id: crypto.randomUUID(),
      kind: "habit" as const,
      name: h.name.trim().slice(0, 40),
      icon: (HABIT_ICONS as readonly string[]).includes(h.icon) ? h.icon : "sun",
      detail: h.why,
    })),
    ...(verdict.projects ?? []).map((p) => ({
      id: crypto.randomUUID(),
      kind: "project" as const,
      name: p.name.trim().slice(0, 60),
      detail: p.why,
    })),
  ];
  return {
    id: crypto.randomUUID(),
    playerId: PLAYER_ID,
    strategy: verdict.strategy,
    items,
    appliedAt: null,
    createdAt: Date.now(),
  };
}

async function savePlan(plan: AiPlan): Promise<void> {
  await db.transaction("rw", db.aiPlans, async () => {
    // Only the latest plan is kept.
    await db.aiPlans.where("playerId").equals(PLAYER_ID).delete();
    await db.aiPlans.add(plan);
  });
}

/** Generates a fresh plan from the player's profile. Replaces any current plan. */
export async function generatePlan(): Promise<AiPlan> {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("Add your Gemini API key in Settings first.");

  const [player, skills, habits, projects] = await Promise.all([
    db.players.get(PLAYER_ID),
    db.skills.where("playerId").equals(PLAYER_ID).toArray(),
    db.habits.where("playerId").equals(PLAYER_ID).toArray(),
    db.projects.where("playerId").equals(PLAYER_ID).toArray(),
  ]);
  if (!player) throw new Error("No character found.");

  const verdict = await requestPlan(buildPlanPrompt(player, skills, habits, projects), apiKey);
  const plan = verdictToPlan(verdict);
  await savePlan(plan);
  return plan;
}

/** Revises the current plan according to the player's feedback. */
export async function refinePlan(feedback: string): Promise<AiPlan> {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("Add your Gemini API key in Settings first.");
  if (!feedback.trim()) throw new Error("Tell the Coach what to change.");

  const [player, skills, habits, projects] = await Promise.all([
    db.players.get(PLAYER_ID),
    db.skills.where("playerId").equals(PLAYER_ID).toArray(),
    db.habits.where("playerId").equals(PLAYER_ID).toArray(),
    db.projects.where("playerId").equals(PLAYER_ID).toArray(),
  ]);
  if (!player) throw new Error("No character found.");
  const current = await getLatestPlan();

  const verdict = await requestPlan(
    buildPlanPrompt(player, skills, habits, projects) +
      `\nHere is the current plan as JSON:\n${JSON.stringify(
        { strategy: current?.strategy, habits: current?.items.filter((i) => i.kind === "habit").map(({ name, icon, detail }) => ({ name, icon, why: detail })), projects: current?.items.filter((i) => i.kind === "project").map(({ name, detail }) => ({ name, why: detail })) },
        null,
        2
      )}\n\nThe player's requested changes: """${feedback.trim()}"""\n\nReturn the FULL revised plan (not just the diff), following the same rules.`,
    apiKey
  );
  const plan = verdictToPlan(verdict);
  await savePlan(plan);
  return plan;
}

export async function getLatestPlan(): Promise<AiPlan | undefined> {
  const plans = await db.aiPlans
    .where("playerId")
    .equals(PLAYER_ID)
    .sortBy("createdAt");
  return plans.at(-1);
}

/** Creates the selected plan items as real habits/projects. */
export async function applyPlan(
  itemIds: string[]
): Promise<{ habits: number; projects: number }> {
  const plan = await getLatestPlan();
  if (!plan) throw new Error("No plan to apply.");
  const chosen = plan.items.filter((i) => itemIds.includes(i.id));
  let habits = 0;
  let projects = 0;
  for (const item of chosen) {
    if (item.kind === "habit") {
      await addHabit(item.name, item.icon ?? "sun");
      habits += 1;
    } else {
      await addProject(item.name);
      projects += 1;
    }
  }
  await db.aiPlans.update(plan.id, { appliedAt: Date.now() });
  await db.activityLog.add({
    id: crypto.randomUUID(),
    playerId: PLAYER_ID,
    timestamp: Date.now(),
    message: `Applied the Coach's plan — ${habits} habit(s) and ${projects} project(s) added.`,
    xpGained: 0,
    coinsGained: 0,
    sourceType: "system",
  });
  return { habits, projects };
}
