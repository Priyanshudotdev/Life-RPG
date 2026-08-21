export type ProjectStatus = "inbox" | "in_progress" | "done";
export type LogSourceType = "habit" | "skill" | "project" | "system" | "shop";

/** When a habit or goal is meant to happen. */
export type TimeOfDay = "morning" | "midday" | "evening" | "night" | "custom";

/** How often a habit or goal recurs. */
export type RecurrenceType =
  | "daily"
  | "weekdays"
  | "weekends"
  | "weekly"
  | "biweekly"
  | "custom";

/**
 * Shared recurrence for habits and goals. A missing Schedule row means
 * "runs every day, no fixed time" — the implicit default.
 */
export interface Schedule {
  id: string;
  ownerId: string; // habit id or project id
  ownerType: "habit" | "goal";
  timeOfDay: TimeOfDay;
  /** HH:mm, only when timeOfDay is "custom". */
  customTime?: string;
  recurrenceType: RecurrenceType;
  /** Weekday ints 0 (Sun) – 6 (Sat), only when recurrenceType is "custom". */
  customDays?: number[];
  /** Week interval for weekly/biweekly cadence (1 = every week, 2 = biweekly). */
  intervalWeeks?: number;
  /** ISO date anchor used to compute which week a weekly/biweekly item lands on. */
  startDate: string;
  active: boolean;
}

/** An append-only goal. Once written, it can never be edited or removed. */
export interface Target {
  id: string;
  text: string;
  createdAt: number;
}

export interface Player {
  id: string;
  name: string;
  portraitId: string;
  level: number;
  hp: number;
  hpMax: number;
  focus: number;
  focusMax: number;
  coins: number;
  /** Append-only list of goals (first entry = the original master objective). */
  targets: Target[];
  strengths: string[];
  weaknesses: string[];
  /** Legacy single-string fields from v1 records; kept for migration only. */
  masterObjective?: string;
  minorObjective?: string;
  lastActiveDate: string; // ISO date (yyyy-mm-dd)
  createdAt: number;
}

export interface Skill {
  id: string;
  playerId: string;
  name: string;
  category: string;
  level: number;
  xp: number;
  xpToNext: number;
  rank: string;
}

export interface Habit {
  id: string;
  playerId: string;
  name: string;
  icon: string; // lucide icon key
  streakCount: number;
  lastCheckInDate: string | null; // ISO date
  weeklyLog: string[]; // ISO dates of check-ins (kept for the weekly grid)
}

export interface Project {
  id: string;
  playerId: string;
  name: string;
  status: ProjectStatus;
  progressPct: number;
  updatedAt: number;
}

export interface ActivityLogEntry {
  id: string;
  playerId: string;
  timestamp: number;
  message: string;
  xpGained: number;
  coinsGained: number;
  sourceType: LogSourceType;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  costCoins: number;
  imageAsset: string; // emoji stand-in for MVP art
  category: string;
}

export interface Purchase {
  id: string;
  playerId: string;
  shopItemId: string;
  purchasedAt: number;
}

/** One AI Coach daily debrief. */
export interface AiReview {
  id: string;
  playerId: string;
  date: string; // ISO date (yyyy-mm-dd)
  score: number; // 0-100
  summary: string;
  wins: string[];
  improvements: string[];
  /** Names of habits the coach credited as done today. */
  habitsMatched: string[];
  journalText: string;
  createdAt: number;
}

/** A habit or project suggested by the AI plan. */
export interface PlanItem {
  id: string;
  kind: "habit" | "project";
  name: string;
  /** HABIT_ICONS key (habits only). */
  icon?: string;
  detail: string;
}

/** An AI-generated action plan toward the player's targets. */
export interface AiPlan {
  id: string;
  playerId: string;
  strategy: string;
  items: PlanItem[];
  appliedAt: number | null;
  createdAt: number;
}

export interface OnboardingDraft {
  firstTarget: string;
  secondTarget: string;
  selectedSkills: string[];
  skillLevels: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  characterName: string;
  portraitId: string;
}
