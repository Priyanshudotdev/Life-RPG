"use client";

import { CalendarClock, CheckCircle2, Hammer, Inbox, Loader, Plus, Trash2 } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { ScheduleEditor, ScheduleSubtitle } from "@/components/schedule-editor";
import { Button } from "@/components/ui/button";
import { FieldLabel, TextInput } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/segmented-bar";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { db, PLAYER_ID } from "@/lib/db";
import {
  addProject,
  completeProject,
  deleteProject,
  moveProject,
  setProjectProgress,
} from "@/lib/game";
import {
  clearScheduleForOwner,
  saveScheduleForOwner,
  useScheduleMap,
} from "@/lib/schedule";
import type { Project, Schedule } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "inbox" | "in_progress" | "done";

const TAB_ITEMS: TabItem<Tab>[] = [
  { value: "inbox", label: "Inbox" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export default function ProjectsPage() {
  const projects = useLiveQuery(
    () => db.projects.where("playerId").equals(PLAYER_ID).toArray(),
    []
  );
  const [tab, setTab] = useState<Tab>("inbox");
  const [newName, setNewName] = useState("");
  const [flash, setFlash] = useState<{ id: string; text: string; ok: boolean } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const scheduleMap = useScheduleMap();

  async function handleSaveSchedule(projectId: string, patch: Partial<Schedule>) {
    await saveScheduleForOwner(projectId, "goal", patch);
    setEditingId(null);
  }

  async function handleClearSchedule(projectId: string) {
    await clearScheduleForOwner(projectId);
    setEditingId(null);
  }

  const list = (projects ?? []).filter((p) => p.status === tab);
  const counts: Record<Tab, number | undefined> = {
    inbox: (projects ?? []).filter((p) => p.status === "inbox").length,
    in_progress: (projects ?? []).filter((p) => p.status === "in_progress").length,
    done: (projects ?? []).filter((p) => p.status === "done").length,
  };

  async function handleAdd() {
    if (!newName.trim()) return;
    await addProject(newName);
    setNewName("");
  }

  async function handleStageClear(project: Project) {
    const result = await completeProject(project.id);
    setFlash({
      id: project.id,
      text: result.ok
        ? `Stage clear! +50 XP · +25 coins`
        : result.reason,
      ok: result.ok,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Projects & Stages</h1>
        <p className="mt-1 text-sm text-ink-500">
          Quests in three acts. Clearing a stage earns a chunky reward.
        </p>
      </div>

      {/* Add project */}
      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <FieldLabel>New quest</FieldLabel>
            <TextInput
              value={newName}
              maxLength={60}
              placeholder="e.g. Redesign the portfolio site"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleAdd()}
            />
          </div>
          <Button onClick={() => void handleAdd()} disabled={!newName.trim()} className="shrink-0">
            <Plus className="h-4 w-4" /> Add to Inbox
          </Button>
        </div>
      </Panel>

      <Tabs
        items={TAB_ITEMS.map((t) => ({ ...t, count: counts[t.value] }))}
        value={tab}
        onChange={setTab}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {list.map((project) => {
          const schedule = scheduleMap?.[project.id];
          return (
          <Panel key={project.id} className={cn(project.status === "done" && "opacity-75")}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border",
                    project.status === "done"
                      ? "border-moss-300 bg-moss-100 text-moss-600"
                      : project.status === "in_progress"
                        ? "border-gold-400 bg-gold-100 text-gold-600"
                        : "border-parchment-400 bg-parchment-100 text-ink-400"
                  )}
                >
                  {project.status === "done" ? (
                    <CheckCircle2 className="h-4.5 w-4.5" />
                  ) : project.status === "in_progress" ? (
                    <Loader className="h-4.5 w-4.5" />
                  ) : (
                    <Inbox className="h-4.5 w-4.5" />
                  )}
                </span>
                <div className="min-w-0">
                  <h3
                    className={cn(
                      "min-w-0 break-words font-display font-bold text-ink-900",
                      project.status === "done" && "line-through decoration-moss-500/60"
                    )}
                  >
                    {project.name}
                  </h3>
                  <ScheduleSubtitle schedule={schedule} />
                </div>
              </div>
              <div className="flex shrink-0 items-start gap-1">
                <button
                  aria-label={`Edit schedule for ${project.name}`}
                  onClick={() => setEditingId(editingId === project.id ? null : project.id)}
                  className={cn(
                    "cursor-pointer rounded-lg p-1.5 transition-colors",
                    editingId === project.id || schedule
                      ? "bg-moss-100 text-moss-600"
                      : "text-ink-400 opacity-60 hover:bg-parchment-200 hover:opacity-100"
                  )}
                >
                  <CalendarClock className="h-4 w-4" />
                </button>
                <button
                  aria-label={`Delete ${project.name}`}
                  onClick={() => void deleteProject(project.id)}
                  className="cursor-pointer rounded-lg p-1.5 text-ink-400 opacity-60 transition-opacity hover:bg-terra-100 hover:text-terra-600 hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {editingId === project.id && (
              <div className="mt-4">
                <ScheduleEditor
                  ownerId={project.id}
                  ownerType="goal"
                  current={schedule}
                  onSave={(patch) => void handleSaveSchedule(project.id, patch)}
                  onRemove={() => void handleClearSchedule(project.id)}
                />
              </div>
            )}

            {project.status !== "inbox" && (
              <div className="mt-4">
                <div className="mb-1 flex justify-between font-mono text-[11px] text-ink-400">
                  <span>Progress</span>
                  <span>{project.progressPct}%</span>
                </div>
                <ProgressBar pct={project.progressPct} tone={project.status === "done" ? "moss" : "gold"} />
                {project.status === "in_progress" && (
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={10}
                    value={project.progressPct}
                    aria-label={`Progress for ${project.name}`}
                    onChange={(e) =>
                      void setProjectProgress(project.id, Number(e.target.value))
                    }
                    className="mt-2 w-full accent-moss-500"
                  />
                )}
              </div>
            )}

            {flash?.id === project.id ? (
              <p
                role="status"
                className={cn(
                  "mt-4 rounded-lg border px-3 py-2 text-center text-xs font-semibold",
                  flash.ok
                    ? "border-moss-300 bg-moss-50 text-moss-600"
                    : "border-terra-300 bg-terra-100/60 text-terra-600"
                )}
              >
                {flash.text}
              </p>
            ) : null}

            <div className="mt-4 flex gap-2">
              {project.status === "inbox" && (
                <Button size="sm" onClick={() => void moveProject(project.id, "in_progress")}>
                  <Hammer className="h-3.5 w-3.5" /> Start quest
                </Button>
              )}
              {project.status === "in_progress" && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => void moveProject(project.id, "inbox")}>
                    Back to Inbox
                  </Button>
                  <Button size="sm" variant="accent" onClick={() => void handleStageClear(project)}>
                    Stage Clear
                  </Button>
                </>
              )}
              {project.status === "done" && (
                <Button size="sm" variant="ghost" disabled>
                  Cleared ✓
                </Button>
              )}
            </div>
          </Panel>
          );
        })}
      </div>

      {list.length === 0 && (
        <Panel className="py-12 text-center">
          <p className="font-display font-semibold text-ink-400">
            Nothing here — {tab === "inbox" ? "add a quest above." : tab === "in_progress" ? "start something from your Inbox." : "clear a stage to fill this shelf."}
          </p>
        </Panel>
      )}
    </div>
  );
}
