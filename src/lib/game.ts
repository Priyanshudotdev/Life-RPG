import {
  db,
  PLAYER_ID,
} from "./db";
import type {
  LogSourceType,
  OnboardingDraft,
  Player,
  Skill,
  Target,
} from "./types";
import { getScheduleFor, streakShouldContinue } from "./schedule";
import { todayISO } from "./utils";

/* ── Configurable reward / cost table ─────────────────────── */
export const REWARDS = {
  habit: { xp: 20, coins: 10, focusCost: 10 },
  habitStreakBonusXpPerDay: 2,
  projectStageClear: { xp: 50, coins: 25, focusCost: 20 },
  skillLevelUpCoins: 15,
} as const;

/* ── Skill catalog (players pick any subset) ──────────────── */
export const SKILL_CATALOG = [
  { name: "Creativity", category: "Mind", blurb: "Making things from nothing" },
  { name: "Writing", category: "Mind", blurb: "Words that land" },
  { name: "Learning", category: "Mind", blurb: "Absorbing new ideas" },
  { name: "Languages", category: "Mind", blurb: "New tongues, new worlds" },
  { name: "Health", category: "Body", blurb: "Energy, movement, rest" },
  { name: "Cooking", category: "Body", blurb: "Fuel worth savoring" },
  { name: "Financial", category: "World", blurb: "Earning, saving, investing" },
  { name: "Career", category: "World", blurb: "The daily grind, leveled" },
  { name: "Public Speaking", category: "World", blurb: "Holding the room" },
  { name: "Video Editing", category: "Craft", blurb: "Cutting stories together" },
  { name: "Coding", category: "Craft", blurb: "Bending machines to will" },
  { name: "Music", category: "Craft", blurb: "Noise turned to signal" },
] as const;

/* ── Rank titles by level band ────────────────────────────── */
const RANK_BANDS: Array<[number, string]> = [
  [1, "Novice"],
  [3, "Apprentice"],
  [5, "Journeyman"],
  [8, "Adept"],
  [11, "Expert"],
  [14, "Master"],
];

export function rankForLevel(level: number): string {
  let rank = RANK_BANDS[0][1];
  for (const [min, title] of RANK_BANDS) {
    if (level >= min) rank = title;
  }
  return rank;
}

/* ── XP curve ─────────────────────────────────────────────── */
export function xpToNextFor(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

/* ── Portraits (preset set) ───────────────────────────────── */
export const PORTRAITS = [
  { id: "ranger", label: "The Ranger", hue: "moss" },
  { id: "scholar", label: "The Scholar", hue: "plum" },
  { id: "smith", label: "The Smith", hue: "terra" },
  { id: "bard", label: "The Bard", hue: "gold" },
  { id: "monk", label: "The Monk", hue: "moss" },
  { id: "alchemist", label: "The Alchemist", hue: "plum" },
] as const;

/* ── Habit icon choices (lucide keys) ─────────────────────── */
export const HABIT_ICONS = [
  "sun",
  "book-open",
  "dumbbell",
  "pen-line",
  "code",
  "salad",
  "moon",
  "heart",
] as const;

/* ── Shop catalog (seeded once) ───────────────────────────── */
export const SHOP_CATALOG = [
  { name: "Cozy Blanket", description: "+5 cozy. Non-negotiable.", costCoins: 40, imageAsset: "🧣", category: "Comfort" },
  { name: "Fancy Tea Tin", description: "A well-earned brew between quests.", costCoins: 30, imageAsset: "🍵", category: "Comfort" },
  { name: "Leather Journal", description: "For plotting your next arc.", costCoins: 60, imageAsset: "📓", category: "Tools" },
  { name: "Lucky Dice", description: "They always roll what you need.", costCoins: 45, imageAsset: "🎲", category: "Trinkets" },
  { name: "Potted Fern", description: "A low-stakes companion.", costCoins: 35, imageAsset: "🪴", category: "Comfort" },
  { name: "Candle of Focus", description: "Smells like deep work.", costCoins: 50, imageAsset: "🕯️", category: "Tools" },
  { name: "Festival Ticket", description: "You've earned a night out.", costCoins: 120, imageAsset: "🎟️", category: "Experiences" },
  { name: "New Sketchbook", description: "Blank pages, big plans.", costCoins: 55, imageAsset: "🎨", category: "Tools" },
  { name: "Board Game Night", description: "Invite the party over.", costCoins: 90, imageAsset: "♟️", category: "Experiences" },
] as const;

/* ── Level-up math shared by all XP grants ────────────────── */
function applyXpGain(skill: Skill, xp: number): { skill: Skill; levelsGained: number } {
  let level = skill.level;
  let carry = skill.xp + xp;
  let xpToNext = skill.xpToNext;
  let levelsGained = 0;
  while (carry >= xpToNext) {
    carry -= xpToNext;
    level += 1;
    levelsGained += 1;
    xpToNext = xpToNextFor(level);
  }
  return {
    skill: { ...skill, xp: carry, level, xpToNext, rank: rankForLevel(level) },
    levelsGained,
  };
}

async function log(
  playerId: string,
  message: string,
  xpGained: number,
  coinsGained: number,
  sourceType: LogSourceType
) {
  await db.activityLog.add({
    id: crypto.randomUUID(),
    playerId,
    timestamp: Date.now(),
    message,
    xpGained,
    coinsGained,
    sourceType,
  });
}

/* ── Daily reset: refill resources, break stale streaks ───── */
export async function runDailyResetIfNeeded(): Promise<void> {
  const player = await db.players.get(PLAYER_ID);
  if (!player) return;
  const today = todayISO();
  if (player.lastActiveDate === today) return;

  const habits = await db.habits.where("playerId").equals(player.id).toArray();
  for (const habit of habits) {
    if (habit.lastCheckInDate && habit.streakCount > 0) {
      const gapDays = Math.round(
        (new Date(`${today}T00:00:00`).getTime() -
          new Date(`${habit.lastCheckInDate}T00:00:00`).getTime()) /
          86_400_000
      );
      if (gapDays > 1) {
        await db.habits.update(habit.id, { streakCount: 0 });
        await log(
          player.id,
          `Streak broken on “${habit.name}” — no worries, today is a fresh start.`,
          0,
          0,
          "system"
        );
      }
    }
  }

  await db.players.update(player.id, {
    lastActiveDate: today,
    hp: player.hpMax,
    focus: player.focusMax,
  });
}

/* ── Migration: bring v1 player records up to the current shape ── */
export async function ensurePlayerShape(): Promise<void> {
  const p = await db.players.get(PLAYER_ID);
  if (!p) return;
  const patch: Partial<Player> = {};
  if (!p.targets) {
    const seeded: Target[] = [];
    if (p.masterObjective?.trim()) {
      seeded.push({ id: crypto.randomUUID(), text: p.masterObjective.trim(), createdAt: p.createdAt });
    }
    if (p.minorObjective?.trim()) {
      seeded.push({ id: crypto.randomUUID(), text: p.minorObjective.trim(), createdAt: p.createdAt });
    }
    patch.targets = seeded;
  }
  const legacyStrengths = p.strengths as unknown;
  if (!Array.isArray(p.strengths)) {
    patch.strengths =
      typeof legacyStrengths === "string" && legacyStrengths.trim()
        ? [legacyStrengths.trim()]
        : [];
  }
  const legacyWeaknesses = p.weaknesses as unknown;
  if (!Array.isArray(p.weaknesses)) {
    patch.weaknesses =
      typeof legacyWeaknesses === "string" && legacyWeaknesses.trim()
        ? [legacyWeaknesses.trim()]
        : [];
  }
  if (Object.keys(patch).length > 0) {
    await db.players.update(PLAYER_ID, patch);
  }
}

/* ── Create player from onboarding draft ──────────────────── */
export async function createPlayerFromOnboarding(draft: OnboardingDraft): Promise<void> {
  const now = Date.now();
  const targets: Target[] = [draft.firstTarget, draft.secondTarget]
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text) => ({ id: crypto.randomUUID(), text, createdAt: now }));

  const player: Player = {
    id: PLAYER_ID,
    name: draft.characterName.trim() || "Wanderer",
    portraitId: draft.portraitId,
    level: 1,
    hp: 100,
    hpMax: 100,
    focus: 100,
    focusMax: 100,
    coins: 0,
    targets,
    strengths: draft.strengths.filter((s) => s.trim()),
    weaknesses: draft.weaknesses.filter((w) => w.trim()),
    lastActiveDate: todayISO(),
    createdAt: now,
  };

  const seen = new Set<string>();
  const names: string[] = [];
  for (const raw of draft.selectedSkills) {
    const name = raw.trim().slice(0, 40);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  // Fall back to a starter trio if the player somehow added none.
  if (names.length === 0) names.push("Creativity", "Health", "Learning");

  const skills: Skill[] = names.map((name) => {
    const def = SKILL_CATALOG.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
    const level = Math.max(1, Math.min(5, draft.skillLevels[name] ?? 1));
    return {
      id: crypto.randomUUID(),
      playerId: PLAYER_ID,
      name,
      category: def?.category ?? "Custom",
      level,
      xp: 0,
      xpToNext: xpToNextFor(level),
      rank: rankForLevel(level),
    };
  });

  const seedHabits = (draft.seedHabits ?? [])
    .map((h) => ({ ...h, name: h.name.trim().slice(0, 40) }))
    .filter((h) => h.name)
    .slice(0, 8);

  await db.transaction(
    "rw",
    db.players,
    db.skills,
    db.habits,
    db.shopItems,
    db.activityLog,
    async () => {
      await db.players.put(player);
      await db.skills.bulkAdd(skills);
      if (seedHabits.length > 0) {
        await db.habits.bulkAdd(
          seedHabits.map((h) => ({
            id: crypto.randomUUID(),
            playerId: PLAYER_ID,
            name: h.name,
            icon: h.icon,
            streakCount: 0,
            lastCheckInDate: null,
            weeklyLog: [],
          }))
        );
      }
      const existing = await db.shopItems.count();
      if (existing === 0) {
        await db.shopItems.bulkAdd(SHOP_CATALOG.map((item) => ({ ...item, id: crypto.randomUUID() })));
      }
      await log(
        player.id,
        `${player.name} entered the world. The adventure begins!`,
        0,
        0,
        "system"
      );
    }
  );
}

/* ── Targets: append-only by design ───────────────────────── */
export async function addTarget(text: string): Promise<boolean> {
  const player = await db.players.get(PLAYER_ID);
  const trimmed = text.trim();
  if (!player || !trimmed) return false;
  await db.players.update(PLAYER_ID, {
    targets: [...player.targets, { id: crypto.randomUUID(), text: trimmed, createdAt: Date.now() }],
  });
  await log(player.id, `New target inscribed: “${trimmed}”.`, 0, 0, "system");
  return true;
}

/* ── Strength / weakness chip lists ───────────────────────── */
export async function addToStrengthList(text: string): Promise<void> {
  const player = await db.players.get(PLAYER_ID);
  const trimmed = text.trim();
  if (!player || !trimmed) return;
  await db.players.update(PLAYER_ID, { strengths: [...player.strengths, trimmed] });
}

export async function removeFromStrengthList(index: number): Promise<void> {
  const player = await db.players.get(PLAYER_ID);
  if (!player) return;
  await db.players.update(PLAYER_ID, {
    strengths: player.strengths.filter((_, i) => i !== index),
  });
}

export async function addToWeakList(text: string): Promise<void> {
  const player = await db.players.get(PLAYER_ID);
  const trimmed = text.trim();
  if (!player || !trimmed) return;
  await db.players.update(PLAYER_ID, { weaknesses: [...player.weaknesses, trimmed] });
}

export async function removeFromWeakList(index: number): Promise<void> {
  const player = await db.players.get(PLAYER_ID);
  if (!player) return;
  await db.players.update(PLAYER_ID, {
    weaknesses: player.weaknesses.filter((_, i) => i !== index),
  });
}

/* ── Add a skill post-onboarding (any name, starts at Lv. 1) ── */
export async function addPlayerSkill(name: string): Promise<boolean> {
  const trimmed = name.trim().slice(0, 40);
  if (!trimmed) return false;
  const existing = await db.skills.where("playerId").equals(PLAYER_ID).toArray();
  if (
    existing.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())
  ) {
    return false;
  }
  const def = SKILL_CATALOG.find(
    (s) => s.name.toLowerCase() === trimmed.toLowerCase()
  );
  await db.skills.add({
    id: crypto.randomUUID(),
    playerId: PLAYER_ID,
    name: trimmed,
    category: def?.category ?? "Custom",
    level: 1,
    xp: 0,
    xpToNext: xpToNextFor(1),
    rank: rankForLevel(1),
  });
  return true;
}

/* ── Habit check-in ───────────────────────────────────────── */
export type CheckInResult =
  | { ok: true; xp: number; coins: number; leveledUpSkills: string[] }
  | { ok: false; reason: string };

export async function checkInHabit(habitId: string): Promise<CheckInResult> {
  const player = await db.players.get(PLAYER_ID);
  const habit = await db.habits.get(habitId);
  if (!player || !habit) return { ok: false, reason: "Not found." };

  const today = todayISO();
  if (habit.lastCheckInDate === today) {
    return { ok: false, reason: "Already checked in today." };
  }
  if (player.focus < REWARDS.habit.focusCost) {
    return {
      ok: false,
      reason: "Out of focus for today — rest up, tomorrow refills your flask.",
    };
  }

  // Streak: consecutive due-days continue, otherwise restart at 1.
  // Habits with a Schedule skip non-due days without breaking the chain.
  const schedule = await getScheduleFor(habit.id);
  const continues = streakShouldContinue(habit.lastCheckInDate, schedule);
  const streak = continues ? habit.streakCount + 1 : 1;

  const bonusXp = Math.min(streak - 1, 7) * REWARDS.habitStreakBonusXpPerDay;
  const xp = REWARDS.habit.xp + bonusXp;
  const coins = REWARDS.habit.coins;

  // Route habit XP into its closest-matching skill (round-robin by category mapping).
  const targetSkill = await pickSkillForHabit(habit.icon);
  const leveledUpSkills: string[] = [];

  await db.transaction(
    "rw",
    db.players,
    db.habits,
    db.skills,
    db.activityLog,
    async () => {
      await db.habits.update(habit.id, {
        streakCount: streak,
        lastCheckInDate: today,
        weeklyLog: [...habit.weeklyLog.filter((d) => d !== today), today].slice(-28),
      });
      await db.players.update(player.id, {
        focus: Math.max(0, player.focus - REWARDS.habit.focusCost),
        coins: player.coins + coins,
      });
      if (targetSkill) {
        const { skill: updated, levelsGained } = applyXpGain(targetSkill, xp);
        await db.skills.put(updated);
        if (levelsGained > 0) {
          leveledUpSkills.push(`${updated.name} → Lv. ${updated.level}`);
          await db.players.update(player.id, {
            coins: (await db.players.get(player.id))!.coins + levelsGained * REWARDS.skillLevelUpCoins,
          });
          await log(
            player.id,
            `Leveled up! ${updated.name} is now Lv. ${updated.level}.`,
            0,
            levelsGained * REWARDS.skillLevelUpCoins,
            "skill"
          );
        }
      }
      await log(
        player.id,
        `Checked in “${habit.name}”${streak > 1 ? ` — ${streak}-day streak!` : ""}`,
        xp,
        coins,
        "habit"
      );
    }
  );

  return { ok: true, xp, coins, leveledUpSkills };
}

async function pickSkillForHabit(icon: string): Promise<Skill | undefined> {
  const skills = await db.skills.where("playerId").equals(PLAYER_ID).toArray();
  if (skills.length === 0) return undefined;
  const map: Record<string, string> = {
    sun: "Health",
    salad: "Cooking",
    dumbbell: "Health",
    heart: "Health",
    moon: "Health",
    "book-open": "Learning",
    code: "Coding",
    "pen-line": "Writing",
  };
  const preferred = map[icon];
  return (
    skills.find((s) => s.name === preferred) ??
    skills.reduce((a, b) => (a.level <= b.level ? a : b))
  );
}

/* ── Shared reward helper (journeys grant milestone loot) ─── */
export async function grantSkillXpAndCoins(
  skillId: string | null | undefined,
  xp: number,
  coins: number
): Promise<{ leveledUpSkills: string[] }> {
  const player = await db.players.get(PLAYER_ID);
  if (!player) return { leveledUpSkills: [] };
  const leveledUpSkills: string[] = [];
  await db.transaction("rw", db.players, db.skills, db.activityLog, async () => {
    if (coins !== 0) {
      await db.players.update(player.id, { coins: player.coins + coins });
    }
    if (skillId && xp !== 0) {
      const skill = await db.skills.get(skillId);
      if (skill) {
        const { skill: updated, levelsGained } = applyXpGain(skill, xp);
        await db.skills.put(updated);
        if (levelsGained > 0) {
          leveledUpSkills.push(`${updated.name} → Lv. ${updated.level}`);
          await db.players.update(player.id, {
            coins:
              (await db.players.get(player.id))!.coins +
              levelsGained * REWARDS.skillLevelUpCoins,
          });
          await log(
            player.id,
            `Leveled up! ${updated.name} is now Lv. ${updated.level}.`,
            0,
            levelsGained * REWARDS.skillLevelUpCoins,
            "skill"
          );
        }
      }
    }
  });
  return { leveledUpSkills };
}

/* ── Projects ─────────────────────────────────────────────── */
export type ProjectResult = { ok: true } | { ok: false; reason: string };

export async function addProject(name: string): Promise<void> {
  const player = await db.players.get(PLAYER_ID);
  if (!player || !name.trim()) return;
  await db.projects.add({
    id: crypto.randomUUID(),
    playerId: player.id,
    name: name.trim(),
    status: "inbox",
    progressPct: 0,
    updatedAt: Date.now(),
  });
}

export async function moveProject(id: string, status: "inbox" | "in_progress"): Promise<void> {
  await db.projects.update(id, { status, updatedAt: Date.now() });
}

export async function setProjectProgress(id: string, progressPct: number): Promise<void> {
  await db.projects.update(id, {
    progressPct: Math.max(0, Math.min(100, progressPct)),
    updatedAt: Date.now(),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id);
}

export async function completeProject(projectId: string): Promise<ProjectResult> {
  const player = await db.players.get(PLAYER_ID);
  const project = await db.projects.get(projectId);
  if (!player || !project) return { ok: false, reason: "Not found." };
  if (project.status === "done") return { ok: false, reason: "Already cleared." };
  if (player.focus < REWARDS.projectStageClear.focusCost) {
    return {
      ok: false,
      reason: "Too drained to claim this stage today — come back tomorrow.",
    };
  }

  await db.transaction("rw", db.players, db.projects, db.activityLog, async () => {
    await db.projects.update(projectId, {
      status: "done",
      progressPct: 100,
      updatedAt: Date.now(),
    });
    await db.players.update(player.id, {
      focus: Math.max(0, player.focus - REWARDS.projectStageClear.focusCost),
      coins: player.coins + REWARDS.projectStageClear.coins,
    });
    await log(
      player.id,
      `Stage clear! “${project.name}” is done.`,
      REWARDS.projectStageClear.xp,
      REWARDS.projectStageClear.coins,
      "project"
    );
  });
  return { ok: true };
}

/* ── Marketplace ──────────────────────────────────────────── */
export type PurchaseResult = { ok: true } | { ok: false; reason: string };

export async function purchaseShopItem(shopItemId: string): Promise<PurchaseResult> {
  const player = await db.players.get(PLAYER_ID);
  const item = await db.shopItems.get(shopItemId);
  if (!player || !item) return { ok: false, reason: "Not found." };
  if (player.coins < item.costCoins) {
    return { ok: false, reason: `Need ${item.costCoins - player.coins} more coins.` };
  }

  await db.transaction("rw", db.players, db.purchases, db.activityLog, async () => {
    await db.players.update(player.id, { coins: player.coins - item.costCoins });
    await db.purchases.add({
      id: crypto.randomUUID(),
      playerId: player.id,
      shopItemId,
      purchasedAt: Date.now(),
    });
    await log(player.id, `Claimed “${item.name}” from the market.`, 0, -item.costCoins, "shop");
  });
  return { ok: true };
}

/* ── Settings edits & reset ───────────────────────────────── */
export async function updatePlayerProfile(patch: Partial<Player>): Promise<void> {
  await db.players.update(PLAYER_ID, patch);
}

export async function addHabit(name: string, icon: string): Promise<void> {
  const player = await db.players.get(PLAYER_ID);
  if (!player || !name.trim()) return;
  await db.habits.add({
    id: crypto.randomUUID(),
    playerId: player.id,
    name: name.trim(),
    icon,
    streakCount: 0,
    lastCheckInDate: null,
    weeklyLog: [],
  });
}

export async function deleteHabit(id: string): Promise<void> {
  await db.habits.delete(id);
}

/** Wipes everything and returns the user to onboarding. */
export async function resetCharacter(): Promise<void> {
  await db.delete();
  await db.open();
}
