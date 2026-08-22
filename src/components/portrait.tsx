import { cn } from "@/lib/utils";

/**
 * Preset illustrated portraits (MVP set of 6).
 * Hand-drawn-feel SVG busts; each has a distinct palette + silhouette.
 */

type PortraitId =
  | "ranger"
  | "scholar"
  | "smith"
  | "bard"
  | "monk"
  | "alchemist";

const SKINS = ["#e8c39a", "#d9a878", "#c68d5f", "#b57a4e", "#a86b40", "#96592f"];

interface PortraitDef {
  bg: string;
  cloak: string;
  accent: string;
  hair: string;
  skinIdx: number;
  hairStyle: "short" | "long" | "hood" | "curly" | "bun" | "hat";
}

const PORTRAIT_DEFS: Record<PortraitId, PortraitDef> = {
  /* Ranger + monk wear the primary hue, so they follow the active theme. */
  ranger: { bg: "var(--moss-100)", cloak: "var(--moss-500)", accent: "#c9973b", hair: "#5d4632", skinIdx: 0, hairStyle: "short" },
  scholar: { bg: "#ecdfed", cloak: "#6c4a70", accent: "#dfc27a", hair: "#3d3428", skinIdx: 1, hairStyle: "bun" },
  smith: { bg: "#f6e0d4", cloak: "#c05f3c", accent: "#4a4330", hair: "#2f2a20", skinIdx: 2, hairStyle: "hat" },
  bard: { bg: "#f5e8c6", cloak: "#c9973b", accent: "#6c4a70", hair: "#8a5a2e", skinIdx: 3, hairStyle: "curly" },
  monk: { bg: "var(--moss-100)", cloak: "var(--moss-400)", accent: "var(--color-parchment-50)", hair: "#4a4330", skinIdx: 4, hairStyle: "hood" },
  alchemist: { bg: "#ecdfed", cloak: "#966f99", accent: "#c05f3c", hair: "#c8c0ae", skinIdx: 5, hairStyle: "long" },
};

export function isPortraitId(id: string): id is PortraitId {
  return id in PORTRAIT_DEFS;
}

export function Portrait({
  portraitId,
  className,
}: {
  portraitId: string;
  className?: string;
}) {
  const def = PORTRAIT_DEFS[(isPortraitId(portraitId) ? portraitId : "ranger") as PortraitId];
  const skin = SKINS[def.skinIdx];
  const blush = "#00000018";

  return (
    <svg viewBox="0 0 96 96" className={cn("h-full w-full", className)} aria-hidden="true">
      <rect width="96" height="96" rx="14" fill={def.bg} />
      {/* shoulders / cloak */}
      <path d="M16 96 C18 74 32 66 48 66 C64 66 78 74 80 96 Z" fill={def.cloak} />
      <path d="M42 68 L48 82 L54 68 Z" fill={def.accent} opacity="0.85" />
      {/* head */}
      <circle cx="48" cy="42" r="19" fill={skin} />
      {/* hair variants */}
      {def.hairStyle === "short" && (
        <path d="M29 42 C27 24 38 20 48 20 C58 20 69 24 67 42 C67 30 60 26 48 26 C36 26 29 30 29 42 Z" fill={def.hair} />
      )}
      {def.hairStyle === "long" && (
        <>
          <path d="M28 44 C25 22 38 18 48 18 C58 18 71 22 68 44 C68 28 60 24 48 24 C36 24 28 28 28 44 Z" fill={def.hair} />
          <path d="M27 40 C24 56 26 62 28 66 L33 64 C30 58 30 48 31 42 Z" fill={def.hair} />
          <path d="M69 40 C72 56 70 62 68 66 L63 64 C66 58 66 48 65 42 Z" fill={def.hair} />
        </>
      )}
      {def.hairStyle === "hood" && (
        <path d="M48 15 C30 15 24 30 26 45 L32 43 C31 30 37 23 48 23 C59 23 65 30 64 43 L70 45 C72 30 66 15 48 15 Z" fill={def.cloak} />
      )}
      {def.hairStyle === "curly" && (
        <g fill={def.hair}>
          <circle cx="35" cy="30" r="7" />
          <circle cx="48" cy="24" r="8" />
          <circle cx="61" cy="30" r="7" />
          <circle cx="30" cy="40" r="5" />
          <circle cx="66" cy="40" r="5" />
        </g>
      )}
      {def.hairStyle === "bun" && (
        <>
          <circle cx="48" cy="17" r="7" fill={def.hair} />
          <path d="M29 42 C27 24 38 21 48 21 C58 21 69 24 67 42 C67 30 60 27 48 27 C36 27 29 30 29 42 Z" fill={def.hair} />
        </>
      )}
      {def.hairStyle === "hat" && (
        <>
          <ellipse cx="48" cy="26" rx="24" ry="6" fill={def.accent} />
          <path d="M34 26 C34 12 62 12 62 26 Z" fill={def.accent} />
          <rect x="34" y="23" width="28" height="4" fill="#00000022" />
        </>
      )}
      {/* face */}
      <circle cx="41" cy="42" r="2.2" fill="#35301f" />
      <circle cx="55" cy="42" r="2.2" fill="#35301f" />
      <path d="M43 51 Q48 55 53 51" stroke="#35301f" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="37" cy="47" r="3" fill={blush} />
      <circle cx="59" cy="47" r="3" fill={blush} />
    </svg>
  );
}

export const ALL_PORTRAITS = Object.entries(PORTRAIT_DEFS).map(([id, def]) => ({
  id,
  label: id.charAt(0).toUpperCase() + id.slice(1),
  def,
}));
