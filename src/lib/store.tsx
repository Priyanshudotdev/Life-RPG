"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { db, PLAYER_ID } from "./db";
import { ensurePlayerShape, runDailyResetIfNeeded } from "./game";
import type { Player, Skill } from "./types";

interface GameState {
  loading: boolean;
  /** undefined = query pending · null = loaded, no player yet */
  player: Player | null | undefined;
  hasPlayer: boolean;
  skills: Skill[];
}

const GameContext = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  // The querier resolves to `null` (never undefined) once the DB read completes,
  // so a missing player is distinguishable from a pending query.
  const player = useLiveQuery(
    async () => (await db.players.get(PLAYER_ID)) ?? null,
    []
  );
  const skills = useLiveQuery(
    () => db.skills.where("playerId").equals(PLAYER_ID).toArray(),
    []
  );
  const resetRan = useRef(false);

  useEffect(() => {
    if (resetRan.current || !player) return;
    resetRan.current = true;
    void ensurePlayerShape().then(() => runDailyResetIfNeeded());
  }, [player]);

  const loading = player === undefined;
  const value: GameState = {
    loading,
    player,
    hasPlayer: !!player,
    skills: skills ?? [],
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameState {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
