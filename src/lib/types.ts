export type ProjectStatus = "inbox" | "in_progress" | "done";
export type LogSourceType = "habit" | "skill" | "project" | "system" | "shop";

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
