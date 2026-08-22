import { cn } from "@/lib/utils";

type Tone = "hp" | "focus" | "xp" | "moss" | "plum" | "gold" | "terra";

/* xp + gold ride the primary hue (lighter step) so every progress bar
   follows the active theme. hp/focus stay fixed: they are game stats,
   not decoration. */
const tones: Record<Tone, { filled: string; empty: string }> = {
  hp: { filled: "bg-terra-500 border-terra-700", empty: "bg-terra-100 border-terra-300" },
  focus: { filled: "bg-plum-500 border-plum-700", empty: "bg-plum-100 border-plum-300" },
  xp: { filled: "bg-moss-400 border-moss-600", empty: "bg-moss-50 border-moss-300" },
  moss: { filled: "bg-moss-500 border-moss-700", empty: "bg-moss-100 border-moss-300" },
  plum: { filled: "bg-plum-500 border-plum-700", empty: "bg-plum-100 border-plum-300" },
  gold: { filled: "bg-moss-400 border-moss-600", empty: "bg-moss-50 border-moss-300" },
  terra: { filled: "bg-terra-500 border-terra-700", empty: "bg-terra-100 border-terra-300" },
};

export function SegmentedBar({
  value,
  max = 5,
  tone = "moss",
  interactive = false,
  onChange,
  className,
  segmentClassName,
  label,
}: {
  value: number;
  max?: number;
  tone?: Tone;
  interactive?: boolean;
  onChange?: (v: number) => void;
  className?: string;
  segmentClassName?: string;
  label?: string;
}) {
  const t = tones[tone];
  return (
    <div
      role={interactive ? "slider" : undefined}
      aria-label={label}
      aria-valuenow={interactive ? value : undefined}
      aria-valuemin={interactive ? 0 : undefined}
      aria-valuemax={interactive ? max : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange?.(Math.min(max, value + 1));
              if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange?.(Math.max(0, value - 1));
            }
          : undefined
      }
      className={cn("flex items-center gap-1", className)}
    >
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        const Segment = (
          <span
            className={cn(
              "h-3 flex-1 rounded-[4px] border transition-colors duration-150",
              filled ? t.filled : t.empty,
              segmentClassName
            )}
          />
        );
        if (!interactive) return <span key={i} className="flex flex-1">{Segment}</span>;
        return (
          <button
            key={i}
            type="button"
            aria-label={`${label ?? "value"}: set to ${i + 1}`}
            onClick={() => onChange?.(i + 1)}
            className="flex flex-1 cursor-pointer"
          >
            {Segment}
          </button>
        );
      })}
    </div>
  );
}

/** Continuous progress bar (XP within a level, goal completion). */
export function ProgressBar({
  pct,
  tone = "gold",
  className,
}: {
  pct: number;
  tone?: Tone;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-2.5 w-full overflow-hidden rounded-full border",
        t.empty,
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", t.filled)}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}
