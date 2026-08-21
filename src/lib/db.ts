import Dexie, { type Table } from "dexie";
import type {
  ActivityLogEntry,
  AiPlan,
  AiReview,
  Habit,
  Player,
  Project,
  Purchase,
  ShopItem,
  Skill,
} from "./types";

export class CozyTacticsDB extends Dexie {
  players!: Table<Player, string>;
  skills!: Table<Skill, string>;
  habits!: Table<Habit, string>;
  projects!: Table<Project, string>;
  activityLog!: Table<ActivityLogEntry, string>;
  shopItems!: Table<ShopItem, string>;
  purchases!: Table<Purchase, string>;
  aiReviews!: Table<AiReview, string>;
  aiPlans!: Table<AiPlan, string>;

  constructor() {
    // Internal DB id kept from the original prototype so existing
    // local characters keep loading across the rename to "Life RPG".
    super("cozy-tactics");
    this.version(1).stores({
      players: "id",
      skills: "id, playerId",
      habits: "id, playerId",
      projects: "id, playerId, status",
      activityLog: "id, playerId, timestamp",
      shopItems: "id",
      purchases: "id, playerId, shopItemId",
    });
    this.version(2).stores({
      aiReviews: "id, playerId, date",
    });
    this.version(3).stores({
      aiPlans: "id, playerId",
    });
  }
}

export const db = new CozyTacticsDB();

export const PLAYER_ID = "local-player";
