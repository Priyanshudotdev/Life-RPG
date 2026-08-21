import { GEMINI_MODEL, getGeminiKey } from "./ai";
import { db, PLAYER_ID } from "./db";
import { addHabit, addProject, grantSkillXpAndCoins } from "./game";
import type { Journey, JourneyMilestone } from "./types";

/* ── Journey: AI-generated learning roadmaps with a manual fallback ── */

export interface MilestoneDraft {
  title: string;
  description: string;
}

const ROADMAP_SCHEMA = {
  type: "object",
  properties: {
    milestones: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Short milestone name, e.g. 'Big-O basics'. Max 60 chars.",
          },
          description: {
            type: "string",
            description:
              "One sentence on what doing this milestone looks like concretely.",
          },
        },
        required: ["title", "description"],
      },
    },
  },
  required: ["milestones"],
} as const;

function buildRoadmapPrompt(goal: string, context?: string): string {
  return `You are the Coach in "Life RPG", a cozy life-gamification app. The player wants a learning roadmap.

Goal: """${goal.trim()}"""
${context?.trim() ? `Extra context from the player: """${context.trim()}"""` : ""}

Design an ordered list of 5-12 milestones that takes a beginner from zero to the goal.
Rules:
- Each milestone is a concrete, finishable chunk of work (days to a couple weeks, not months).
- Order them so each one builds on the previous.
- Titles max 60 chars; descriptions are one practical sentence.`;
}

/**
 * Asks Gemini for an ordered roadmap. Throws when no key is configured or the
 * call fails — callers must fall back to the manual builder in that case.
 */
export async function generateRoadmap(
  goal: string,
  context?: string
): Promise<MilestoneDraft[]> {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("Add your Gemini API key in Settings first.");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildRoadmapPrompt(goal, context) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: ROADMAP_SCHEMA,
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
  const parsed = JSON.parse(text) as { milestones?: MilestoneDraft[] };
  const drafts = (parsed.milestones ?? [])
    .map((m) => ({
      title: String(m.title ?? "").trim().slice(0, 60),
      description: String(m.description ?? "").trim().slice(0, 200),
    }))
    .filter((m) => m.title)
    .slice(0, 12);
  if (drafts.length === 0) throw new Error("Gemini returned no usable milestones.");
  return drafts;
}

/** Persists a journey + its milestones (first current, rest locked). */
export async function createJourney(
  title: string,
  description: string,
  drafts: MilestoneDraft[],
  skillId?: string | null
): Promise<string> {
  const cleanTitle = title.trim();
  const rows = drafts
    .map((d) => ({ title: d.title.trim(), description: d.description.trim() }))
    .filter((d) => d.title)
    .slice(0, 12);
  if (!cleanTitle) throw new Error("Give the journey a name.");
  if (rows.length === 0) throw new Error("Add at least one milestone.");

  const journeyId = crypto.randomUUID();
  await db.transaction(
    "rw",
    db.journeys,
    db.journeyMilestones,
    db.activityLog,
    async () => {
      await db.journeys.add({
        id: journeyId,
        playerId: PLAYER_ID,
        title: cleanTitle.slice(0, 80),
        description: description.trim().slice(0, 200),
        status: "active",
        skillId: skillId ?? null,
        createdAt: Date.now(),
        completedAt: null,
      });
      await db.journeyMilestones.bulkAdd(
        rows.map((d, i) => ({
          id: crypto.randomUUID(),
          journeyId,
          order: i,
          title: d.title.slice(0, 80),
          description: d.description.slice(0, 200),
          status: i === 0 ? ("current" as const) : ("locked" as const),
          xpReward: 25,
          coinReward: 10,
        }))
      );
      await db.activityLog.add({
        id: crypto.randomUUID(),
        playerId: PLAYER_ID,
        timestamp: Date.now(),
        message: `Set out on a new journey: “${cleanTitle}” — ${rows.length} milestones mapped.`,
        xpGained: 0,
        coinsGained: 0,
        sourceType: "system",
      });
    }
  );
  return journeyId;
}

export type MilestoneResult =
  | { ok: true; journeyCompleted: boolean }
  | { ok: false; reason: string };

/**
 * Completes the given milestone, unlocks the next one, and — when it was the
 * last — completes the journey. Grants coin/xp rewards and logs activity.
 */
export async function completeMilestone(milestoneId: string): Promise<MilestoneResult> {
  const ms = await db.journeyMilestones.get(milestoneId);
  if (!ms) return { ok: false, reason: "Milestone not found." };
  if (ms.status !== "current") {
    return { ok: false, reason: "That milestone is locked or already done." };
  }
  const journey: Journey | undefined = await db.journeys.get(ms.journeyId);
  if (!journey || journey.status !== "active") {
    return { ok: false, reason: "This journey is not active." };
  }

  const siblings = (
    await db.journeyMilestones.where("journeyId").equals(ms.journeyId).toArray()
  ).sort((a, b) => a.order - b.order);
  const idx = siblings.findIndex((s) => s.id === ms.id);
  const next = siblings[idx + 1];
  let journeyCompleted = false;

  await db.transaction(
    "rw",
    db.journeys,
    db.journeyMilestones,
    db.players,
    db.skills,
    db.activityLog,
    async () => {
      await db.journeyMilestones.update(ms.id, { status: "completed" });
      if (next) {
        await db.journeyMilestones.update(next.id, { status: "current" });
      } else {
        journeyCompleted = true;
        await db.journeys.update(journey.id, {
          status: "completed",
          completedAt: Date.now(),
        });
      }
      // Rewards: coins always; XP only when a skill link exists (optional by design).
      await grantSkillXpAndCoins(journey.skillId ?? null, ms.xpReward, ms.coinReward);
      await db.activityLog.add({
        id: crypto.randomUUID(),
        playerId: PLAYER_ID,
        timestamp: Date.now(),
        message: journeyCompleted
          ? `Journey complete! “${journey.title}” — every milestone reached.`
          : `Milestone reached: “${ms.title}” (${idx + 1}/${siblings.length} on “${journey.title}”).`,
        xpGained: journey.skillId ? ms.xpReward : 0,
        coinsGained: ms.coinReward,
        sourceType: "system",
      });
    }
  );

  return { ok: true, journeyCompleted };
}

/** Milestones for many journeys, grouped by journeyId, each sorted by order. */
export function groupMilestones(
  all: JourneyMilestone[]
): Record<string, JourneyMilestone[]> {
  const out: Record<string, JourneyMilestone[]> = {};
  for (const m of all) {
    (out[m.journeyId] ??= []).push(m);
  }
  for (const list of Object.values(out)) list.sort((a, b) => a.order - b.order);
  return out;
}

/* ── Integration: pull roadmap steps into habits/quests ───── */

/** Best-guess habit icon from free text (kept within HABIT_ICONS keys). */
export function pickHabitIcon(text: string): string {
  const t = text.toLowerCase();
  if (/\b(code|coding|program|dsa|algo|leetcode|dev|build an app)\b/.test(t)) return "code";
  if (/\b(read|book|study|learn|course|chapter)\b/.test(t)) return "book-open";
  if (/\b(write|journal|blog|essay|draft)\b/.test(t)) return "pen-line";
  if (/\b(run|gym|exercise|workout|train|stretch|walk)\b/.test(t)) return "dumbbell";
  if (/\b(cook|meal|eat|diet)\b/.test(t)) return "salad";
  if (/\b(meditat|sleep|rest|breathe)\b/.test(t)) return "moon";
  return "sun";
}

export type IntegrateResult =
  | { ok: true; name: string; as: "habit" | "project" }
  | { ok: false; reason: string };

/**
 * Turns a roadmap milestone into a real habit or project so it lives in the
 * player's daily loops. Asked per-milestone from the Coach's Roadmap tab.
 */
export async function integrateMilestone(
  milestoneId: string,
  as: "habit" | "project"
): Promise<IntegrateResult> {
  const ms = await db.journeyMilestones.get(milestoneId);
  if (!ms) return { ok: false, reason: "Milestone not found." };
  if (ms.status === "completed") {
    return { ok: false, reason: "That milestone is already completed." };
  }
  if (ms.integratedAs) {
    return { ok: false, reason: `Already added as ${ms.integratedAs === "habit" ? "a habit" : "a quest"}.` };
  }

  const name = ms.title.slice(0, 60);
  if (as === "habit") {
    await addHabit(name, pickHabitIcon(`${name} ${ms.description}`));
  } else {
    await addProject(name);
  }
  await db.transaction("rw", db.journeyMilestones, db.activityLog, async () => {
    await db.journeyMilestones.update(milestoneId, { integratedAs: as });
    await db.activityLog.add({
      id: crypto.randomUUID(),
      playerId: PLAYER_ID,
      timestamp: Date.now(),
      message:
        as === "habit"
          ? `Roadmap step “${name}” joined your daily habits.`
          : `Roadmap step “${name}” became a quest on your board.`,
      xpGained: 0,
      coinsGained: 0,
      sourceType: "system",
    });
  });
  return { ok: true, name, as };
}
