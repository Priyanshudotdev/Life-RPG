"use client";

import { ArrowLeft, ArrowRight, Check, Compass, Flag, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CharacterSheet } from "@/components/character-sheet";
import { ALL_PORTRAITS, Portrait } from "@/components/portrait";
import { Button } from "@/components/ui/button";
import { ChipInput } from "@/components/ui/chip-input";
import { FieldLabel, TextInput } from "@/components/ui/input";
import { SegmentedBar } from "@/components/ui/segmented-bar";
import { createPlayerFromOnboarding, PORTRAITS, SKILL_CATALOG } from "@/lib/game";
import { useGame } from "@/lib/store";
import type { OnboardingDraft } from "@/lib/types";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 7;

const FIRST_TARGET_EXAMPLES = [
  "Travel the world",
  "Get healthy",
  "Launch my startup",
  "Publish a novel",
];

const SECOND_TARGET_EXAMPLES = [
  "Build a daily writing habit",
  "Run a 5k",
  "Ship my side project",
  "Save my first $1k",
];

const initialDraft: OnboardingDraft = {
  firstTarget: "",
  secondTarget: "",
  selectedSkills: [],
  skillLevels: Object.fromEntries(SKILL_CATALOG.map((s) => [s.name, 1])),
  strengths: [],
  weaknesses: [],
  characterName: "",
  portraitId: PORTRAITS[0].id,
};

export default function OnboardingPage() {
  const { loading, hasPlayer } = useGame();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<OnboardingDraft>(initialDraft);
  const [creating, setCreating] = useState(false);

  // Existing players don't re-do onboarding.
  useEffect(() => {
    if (!loading && hasPlayer) router.replace("/dashboard");
  }, [loading, hasPlayer, router]);

  const patch = (p: Partial<OnboardingDraft>) => setDraft((d) => ({ ...d, ...p }));
  const canAdvance = () => {
    switch (step) {
      case 2:
        return draft.firstTarget.trim().length > 0;
      case 3:
        return draft.secondTarget.trim().length > 0;
      case 4:
        return draft.selectedSkills.length > 0;
      case 6:
        return draft.characterName.trim().length > 0;
      default:
        return true;
    }
  };

  async function confirm() {
    setCreating(true);
    try {
      await createPlayerFromOnboarding(draft);
      // Full page load: guarantees the game layout reads the freshly written
      // player from IndexedDB instead of racing the live-query update.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/dashboard");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 py-8">
      {/* Progress dots */}
      <div className="mb-8 flex items-center justify-center gap-2" aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i + 1 === step
                ? "w-6 bg-moss-500"
                : i + 1 < step
                  ? "w-2 bg-moss-400"
                  : "w-2 bg-parchment-400"
            )}
          />
        ))}
      </div>

      <div className="flex-1">
        {step === 1 && <WelcomeStep />}
        {step === 2 && (
          <TargetStep
            title="What's the big goal you're chasing?"
            subtitle="Your Master Objective — the long quest that everything feeds into."
            value={draft.firstTarget}
            onChange={(v) => patch({ firstTarget: v })}
            examples={FIRST_TARGET_EXAMPLES}
            icon={<Flag className="h-5 w-5 text-terra-500" />}
          />
        )}
        {step === 3 && (
          <TargetStep
            title="What's your focus right now, this month?"
            subtitle="Your Minor Objective — the current chapter of the journey."
            value={draft.secondTarget}
            onChange={(v) => patch({ secondTarget: v })}
            examples={SECOND_TARGET_EXAMPLES}
            icon={<Compass className="h-5 w-5 text-moss-500" />}
          />
        )}
        {step === 4 && (
          <SkillSelectStep
            selected={draft.selectedSkills}
            levels={draft.skillLevels}
            onToggle={(name) =>
              patch({
                selectedSkills: draft.selectedSkills.includes(name)
                  ? draft.selectedSkills.filter((s) => s !== name)
                  : [...draft.selectedSkills, name],
                skillLevels: { ...draft.skillLevels, [name]: draft.skillLevels[name] ?? 1 },
              })
            }
            onLevel={(name, v) =>
              patch({ skillLevels: { ...draft.skillLevels, [name]: v } })
            }
          />
        )}
        {step === 5 && (
          <FlawsStep
            strengths={draft.strengths}
            weaknesses={draft.weaknesses}
            onChange={(s, w) => patch({ strengths: s, weaknesses: w })}
          />
        )}
        {step === 6 && (
          <CharacterStep draft={draft} onChange={patch} />
        )}
        {step === 7 && <ConfirmStep draft={draft} />}
      </div>

      {/* Wizard controls */}
      <div className="mt-10 flex items-center justify-between">
        {step > 1 ? (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        ) : (
          <span />
        )}
        {step < TOTAL_STEPS ? (
          <Button size="lg" disabled={!canAdvance()} onClick={() => setStep((s) => s + 1)}>
            {step === 1 ? "Begin" : "Continue"} <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="lg" variant="gold" disabled={creating} onClick={confirm}>
            <Sparkles className="h-4 w-4" />
            {creating ? "Writing your legend…" : "Enter the World"}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Step 1 — Welcome ─────────────────────────────────────── */
function WelcomeStep() {
  return (
    <div className="panel flex min-h-[420px] flex-col items-center justify-center p-10 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl border border-moss-700 bg-moss-500 text-parchment-50 shadow-[0_2px_0_0_var(--color-moss-700)]">
        <Compass className="h-8 w-8" />
      </span>
      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink-900">
        Life RPG
      </h1>
      <p className="mt-3 max-w-sm font-display text-lg font-medium text-ink-500">
        Every legend starts with a single step. Let&apos;s build yours.
      </p>
      <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-400">
        Turn your goals into quests, your habits into streaks, and your skills
        into levels. Everything stays on this device — no accounts, just you
        and the adventure.
      </p>
    </div>
  );
}

/* ── Steps 2 & 3 — First targets ──────────────────────────── */
function TargetStep({
  title,
  subtitle,
  value,
  onChange,
  examples,
  icon,
}: {
  title: string;
  subtitle: string;
  value: string;
  onChange: (v: string) => void;
  examples: readonly string[];
  icon: React.ReactNode;
}) {
  return (
    <div className="panel p-8">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-parchment-400 bg-parchment-100">
          {icon}
        </span>
        <h2 className="font-display text-2xl font-bold text-ink-900">{title}</h2>
      </div>
      <p className="mt-2 text-sm text-ink-500">{subtitle}</p>

      <div className="mt-6">
        <FieldLabel hint={`${value.length}/80`}>Your answer</FieldLabel>
        <TextInput
          autoFocus
          value={value}
          maxLength={80}
          placeholder="Type it out — make it yours…"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      <p className="mt-5 font-display text-xs font-bold uppercase tracking-[0.12em] text-ink-400">
        Need inspiration?
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => onChange(ex)}
            className="cursor-pointer rounded-full border border-parchment-400 bg-parchment-100 px-3.5 py-1.5 text-xs font-medium text-ink-500 transition-colors hover:border-moss-400 hover:bg-moss-50 hover:text-moss-600"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 4 — Pick & rate your skills ─────────────────────── */
function SkillSelectStep({
  selected,
  levels,
  onToggle,
  onLevel,
}: {
  selected: string[];
  levels: Record<string, number>;
  onToggle: (name: string) => void;
  onLevel: (name: string, v: number) => void;
}) {
  const toneCycle = ["moss", "gold", "plum", "terra", "focus", "xp"] as const;
  const chosen = SKILL_CATALOG.filter((s) => selected.includes(s.name));

  return (
    <div className="panel p-8">
      <h2 className="font-display text-2xl font-bold text-ink-900">
        Which skills are you training?
      </h2>
      <p className="mt-2 text-sm text-ink-500">
        Pick as many as you like — each becomes a trackable skill with its own
        XP bar. You can add more later in Settings.
      </p>

      <p className="mt-5 font-display text-xs font-bold uppercase tracking-[0.12em] text-ink-400">
        Select your skills ({selected.length} chosen)
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SKILL_CATALOG.map((skill) => {
          const active = selected.includes(skill.name);
          return (
            <button
              key={skill.name}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(skill.name)}
              className={cn(
                "cursor-pointer rounded-xl border px-3 py-2.5 text-left transition-all",
                active
                  ? "-translate-y-0.5 border-moss-600 bg-moss-50 shadow-lift"
                  : "border-parchment-400 bg-parchment-100 hover:border-parchment-500"
              )}
            >
              <span className="flex items-center justify-between gap-1">
                <span className="font-display text-sm font-bold text-ink-800">
                  {skill.name}
                </span>
                <span
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                    active
                      ? "border-moss-600 bg-moss-500 text-parchment-50"
                      : "border-parchment-400 bg-transparent"
                  )}
                >
                  {active && <Check size={10} strokeWidth={3} />}
                </span>
              </span>
              <span className="mt-0.5 block truncate text-xs text-ink-400">
                {skill.blurb}
              </span>
            </button>
          );
        })}
      </div>

      {chosen.length > 0 && (
        <>
          <div className="rule-dashed my-6" />
          <p className="font-display text-xs font-bold uppercase tracking-[0.12em] text-ink-400">
            Rate where you&apos;re starting from
          </p>
          <div className="mt-3 space-y-4">
            {chosen.map((skill, i) => (
              <div key={skill.name}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="font-display text-sm font-bold text-ink-700">
                    {skill.name}
                  </span>
                  <span className="font-mono text-xs font-bold text-ink-500">
                    Lv. {levels[skill.name] ?? 1}/5
                  </span>
                </div>
                <SegmentedBar
                  interactive
                  label={`${skill.name} starting level`}
                  value={levels[skill.name] ?? 1}
                  max={5}
                  tone={toneCycle[i % toneCycle.length]}
                  onChange={(v) => onLevel(skill.name, v)}
                  segmentClassName="h-4"
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Step 5 — Strengths & weaknesses (multi-entry) ────────── */
function FlawsStep({
  strengths,
  weaknesses,
  onChange,
}: {
  strengths: string[];
  weaknesses: string[];
  onChange: (strengths: string[], weaknesses: string[]) => void;
}) {
  return (
    <div className="panel p-8">
      <h2 className="font-display text-2xl font-bold text-ink-900">
        Every hero has both
      </h2>
      <p className="mt-2 text-sm text-ink-500">
        Add as many as you like — they appear on your character sheet as
        flavor. No judgment here.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <FieldLabel hint={`${strengths.length} added`}>
            Your strengths
          </FieldLabel>
          <ChipInput
            values={strengths}
            onAdd={(v) => onChange([...strengths, v], weaknesses)}
            onRemove={(i) =>
              onChange(strengths.filter((_, idx) => idx !== i), weaknesses)
            }
            placeholder="e.g. I get obsessed with learning new things…"
            addLabel="Add strength"
          />
        </div>
        <div>
          <FieldLabel hint={`${weaknesses.length} added`}>
            What tends to trip you up?
          </FieldLabel>
          <ChipInput
            values={weaknesses}
            onAdd={(v) => onChange(strengths, [...weaknesses, v])}
            onRemove={(i) =>
              onChange(strengths, weaknesses.filter((_, idx) => idx !== i))
            }
            placeholder="e.g. I abandon projects at 80% done…"
            addLabel="Add weakness"
          />
        </div>
      </div>
    </div>
  );
}

/* ── Step 6 — Character creation ──────────────────────────── */
function CharacterStep({
  draft,
  onChange,
}: {
  draft: OnboardingDraft;
  onChange: (p: Partial<OnboardingDraft>) => void;
}) {
  const previewPlayer = makePreviewPlayer(draft);

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_auto]">
      <div className="panel p-8">
        <h2 className="font-display text-2xl font-bold text-ink-900">
          Forge your character
        </h2>
        <p className="mt-2 text-sm text-ink-500">
          A name and a face. You can change these later in Settings.
        </p>

        <div className="mt-6">
          <FieldLabel hint={`${draft.characterName.length}/24`}>Character name</FieldLabel>
          <TextInput
            autoFocus
            value={draft.characterName}
            maxLength={24}
            placeholder="e.g. Priya the Persistent"
            onChange={(e) => onChange({ characterName: e.target.value })}
          />
        </div>

        <p className="mt-6 font-display text-xs font-bold uppercase tracking-[0.12em] text-ink-400">
          Choose a portrait
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6 md:grid-cols-3">
          {ALL_PORTRAITS.map(({ id }) => {
            const def = PORTRAITS.find((p) => p.id === id)!;
            const selected = draft.portraitId === id;
            return (
              <button
                key={id}
                type="button"
                title={def.label}
                aria-pressed={selected}
                onClick={() => onChange({ portraitId: id })}
                className={cn(
                  "cursor-pointer overflow-hidden rounded-xl border-2 transition-all",
                  selected
                    ? "-translate-y-0.5 border-moss-500 shadow-lift"
                    : "border-parchment-300 hover:border-parchment-400"
                )}
              >
                <div className="aspect-square">
                  <Portrait portraitId={id} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="md:w-80">
        <p className="mb-2 flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-[0.12em] text-ink-400">
          <Check className="h-3.5 w-3.5 text-moss-500" /> Live preview
        </p>
        <CharacterSheet player={previewPlayer} />
      </div>
    </div>
  );
}

/* ── Step 7 — Confirm ─────────────────────────────────────── */
function ConfirmStep({ draft }: { draft: OnboardingDraft }) {
  const previewPlayer = makePreviewPlayer(draft);
  const chosen = SKILL_CATALOG.filter((s) => draft.selectedSkills.includes(s.name));

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-ink-900">
          The tale so far
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          One last look before you step into the world.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-[auto_1fr]">
        <CharacterSheet player={previewPlayer} className="md:w-96" />
        <div className="panel p-5">
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-400">
            Starting stats
          </h3>
          <ul className="mt-3 space-y-2.5">
            {chosen.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-ink-700">{s.name}</span>
                <SegmentedBar
                  value={draft.skillLevels[s.name] ?? 1}
                  max={5}
                  tone="moss"
                  className="w-28"
                  label={`${s.name} level`}
                />
                <span className="w-10 text-right font-mono text-xs text-ink-400">
                  Lv. {draft.skillLevels[s.name] ?? 1}
                </span>
              </li>
            ))}
          </ul>
          <div className="rule-dashed my-4" />
          <p className="text-xs leading-relaxed text-ink-400">
            HP and Focus start full. Coins start at 0 — check in habits and
            clear project stages to earn them.
          </p>
        </div>
      </div>
    </div>
  );
}

function makePreviewPlayer(draft: OnboardingDraft) {
  const now = Date.now();
  const targets = [draft.firstTarget, draft.secondTarget]
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text, i) => ({ id: `preview-${i}`, text, createdAt: now }));
  return {
    id: "preview",
    name: draft.characterName.trim() || "Wanderer",
    portraitId: draft.portraitId,
    level: 1,
    hp: 100,
    hpMax: 100,
    focus: 100,
    focusMax: 100,
    coins: 0,
    targets,
    strengths: draft.strengths,
    weaknesses: draft.weaknesses,
    lastActiveDate: "",
    createdAt: now,
  };
}
