"use client";

import { AlertTriangle, Eye, EyeOff, KeyRound, Lock, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChipInput } from "@/components/ui/chip-input";
import { FieldLabel, TextInput } from "@/components/ui/input";
import { Panel, PanelTitle } from "@/components/ui/panel";
import { clearGeminiKey, getGeminiKey, setGeminiKey } from "@/lib/ai";
import {
  SKILL_CATALOG,
  addPlayerSkill,
  addToStrengthList,
  addToWeakList,
  removeFromStrengthList,
  removeFromWeakList,
  resetCharacter,
  updatePlayerProfile,
} from "@/lib/game";
import { useGame } from "@/lib/store";
import type { Player } from "@/lib/types";

export default function SettingsPage() {
  const { player, skills } = useGame();
  if (!player) return null;
  // Keyed by player id so the form re-initializes if the character changes,
  // but live-query updates after a save don't clobber in-progress edits.
  return <SettingsForm key={player.id} player={player} ownedSkills={skills.map((s) => s.name)} />;
}

function ApiKeyForm() {
  const [key, setKey] = useState(getGeminiKey());
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState(false);

  function save() {
    if (key.trim()) {
      setGeminiKey(key);
    } else {
      clearGeminiKey();
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            type={visible ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="AIza…"
            autoComplete="off"
            className="w-full rounded-xl border border-parchment-400 bg-parchment-50 px-3 py-2.5 pr-10 font-mono text-sm text-ink-800 placeholder:text-ink-300 focus:border-moss-500 focus:outline-none"
          />
          <button
            type="button"
            aria-label={visible ? "Hide key" : "Show key"}
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 cursor-pointer"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Button onClick={save}>
          <Save className="h-4 w-4" /> Save
        </Button>
        {getGeminiKey() && (
          <Button
            variant="ghost"
            onClick={() => {
              clearGeminiKey();
              setKey("");
            }}
          >
            <Trash2 className="h-4 w-4" /> Remove
          </Button>
        )}
      </div>
      {saved && (
        <p role="status" className="mt-2 font-display text-sm font-semibold text-moss-600">
          Saved ✓
        </p>
      )}
    </div>
  );
}

function SettingsForm({ player, ownedSkills }: { player: Player; ownedSkills: string[] }) {
  const router = useRouter();

  const [name, setName] = useState(player.name);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [skillAdded, setSkillAdded] = useState(false);

  const availableSkills = SKILL_CATALOG.filter((s) => !ownedSkills.includes(s.name));

  async function handleSave() {
    await updatePlayerProfile({ name: name.trim() || player.name });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleAddSkill() {
    if (!newSkill) return;
    const ok = await addPlayerSkill(newSkill);
    if (ok) {
      setNewSkill("");
      setSkillAdded(true);
      setTimeout(() => setSkillAdded(false), 2000);
    }
  }

  async function handleReset() {
    await resetCharacter();
    router.replace("/onboarding");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Settings</h1>
        <p className="mt-1 text-sm text-ink-500">
          Tune your character and your journal.
        </p>
      </div>

      <Panel>
        <PanelTitle>Character</PanelTitle>
        <div className="mt-4 space-y-4">
          <div>
            <FieldLabel hint={`${name.length}/24`}>Name</FieldLabel>
            <TextInput value={name} maxLength={24} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Targets</FieldLabel>
            <ol className="space-y-1.5">
              {(player.targets ?? []).map((t, i) => (
                <li
                  key={t.id}
                  className="flex items-baseline gap-2.5 rounded-xl border border-parchment-300 bg-parchment-100/60 px-3 py-2"
                >
                  <span className="shrink-0 font-mono text-[11px] font-bold text-moss-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium text-ink-700">{t.text}</span>
                </li>
              ))}
            </ol>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-400">
              <Lock className="h-3 w-3" /> Targets are written in ink — they can&apos;t be
              edited or removed. Add new ones from the Dashboard.
            </p>
          </div>
          <div>
            <FieldLabel hint={`${player.strengths.length} added`}>Strengths</FieldLabel>
            <ChipInput
              values={player.strengths}
              onAdd={(v) => void addToStrengthList(v)}
              onRemove={(i) => void removeFromStrengthList(i)}
              placeholder="e.g. I get obsessed with learning new things…"
              addLabel="Add strength"
            />
          </div>
          <div>
            <FieldLabel hint={`${player.weaknesses.length} added`}>Weaknesses</FieldLabel>
            <ChipInput
              values={player.weaknesses}
              onAdd={(v) => void addToWeakList(v)}
              onRemove={(i) => void removeFromWeakList(i)}
              placeholder="e.g. I abandon projects at 80% done…"
              addLabel="Add weakness"
            />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={() => void handleSave()}>
            <Save className="h-4 w-4" /> Save changes
          </Button>
          {saved && (
            <span role="status" className="font-display text-sm font-semibold text-moss-600">
              Saved ✓
            </span>
          )}
        </div>
      </Panel>

      <Panel>
        <PanelTitle>Skills</PanelTitle>
        {availableSkills.length > 0 ? (
          <>
            <p className="mt-3 text-sm text-ink-500">
              Add another skill to train — it starts fresh at Lv. 1.
            </p>
            <div className="mt-3 flex gap-2">
              <select
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-parchment-400 bg-parchment-50 px-3 py-2.5 text-sm text-ink-800 focus:border-moss-500 focus:outline-none"
              >
                <option value="" disabled>
                  Choose a skill…
                </option>
                {availableSkills.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} — {s.blurb}
                  </option>
                ))}
              </select>
              <Button onClick={() => void handleAddSkill()} disabled={!newSkill}>
                <Plus className="h-4 w-4" /> Add skill
              </Button>
            </div>
            {skillAdded && (
              <p role="status" className="mt-2 font-display text-sm font-semibold text-moss-600">
                Skill added ✓
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm text-ink-500">
            You&apos;re training every skill in the compendium. Impressive.
          </p>
        )}
      </Panel>

      <Panel>
        <PanelTitle className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-gold-600" /> AI Coach
        </PanelTitle>
        <p className="mt-3 text-sm text-ink-500">
          Paste your Gemini API key to enable the AI Coach. It&apos;s stored
          only in this browser and sent directly to Google — never anywhere
          else. Get a free key at{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-moss-600 hover:underline"
          >
            aistudio.google.com/apikey
          </a>
          .
        </p>
        <ApiKeyForm />
      </Panel>

      <Panel>
        <PanelTitle>Display</PanelTitle>
        <p className="mt-3 text-sm text-ink-500">
          Cozy parchment mode is the only mode — and honestly, it&apos;s the best one.
        </p>
      </Panel>

      <Panel className="border-terra-300">
        <PanelTitle className="text-terra-600">Danger Zone</PanelTitle>
        <p className="mt-3 text-sm text-ink-500">
          Wipes all local data (character, habits, projects, log) and restarts
          onboarding. Useful for testing — there is no undo.
        </p>
        {!confirmReset ? (
          <Button variant="danger" className="mt-4" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="h-4 w-4" /> Reset Character
          </Button>
        ) : (
          <div className="mt-4 rounded-xl border border-terra-300 bg-terra-100/60 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-terra-700">
              <AlertTriangle className="h-4 w-4" /> Really erase everything?
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="danger" size="sm" onClick={() => void handleReset()}>
                Yes, wipe it all
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                Keep my legend
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
