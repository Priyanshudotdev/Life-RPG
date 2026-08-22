"use client";

export type ThemeId = "green" | "blue" | "purple" | "pink" | "orange";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  hint: string;
  /** Two dots shown in the picker: primary + light step. */
  swatch: [string, string];
}

export const THEMES: ThemeMeta[] = [
  {
    id: "green",
    label: "Meadow",
    hint: "The classic moss",
    swatch: ["#6e7f4f", "#aebd85"],
  },
  {
    id: "blue",
    label: "Ocean",
    hint: "Calm deep water",
    swatch: ["#396d8b", "#86adc5"],
  },
  {
    id: "purple",
    label: "Arcane",
    hint: "Mage-tower dusk",
    swatch: ["#63518f", "#a794c4"],
  },
  {
    id: "pink",
    label: "Blossom",
    hint: "Spring in bloom",
    swatch: ["#954969", "#cd92a9"],
  },
  {
    id: "orange",
    label: "Ember",
    hint: "Hearth-fire warm",
    swatch: ["#ae6926", "#dfa66f"],
  },
];

const STORAGE_KEY = "life-rpg-theme";
const VALID = new Set<string>(THEMES.map((t) => t.id));

function isThemeId(v: unknown): v is ThemeId {
  return typeof v === "string" && VALID.has(v);
}

/** Reads the persisted theme. Safe on the server (returns the default). */
export function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "green";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isThemeId(raw) ? raw : "green";
  } catch {
    return "green";
  }
}

/** Applies a theme to <html> without persisting it. */
export function applyTheme(id: ThemeId): void {
  if (typeof document === "undefined") return;
  if (id === "green") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = id;
  }
}

/** Persists and applies a theme in one go. */
export function setTheme(id: ThemeId): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Private mode or storage disabled — still apply for this session.
  }
  applyTheme(id);
}
