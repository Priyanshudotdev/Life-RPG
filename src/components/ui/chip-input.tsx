"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChipInput({
  values,
  onAdd,
  onRemove,
  placeholder,
  addLabel = "Add",
  className,
}: {
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
  addLabel?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (values.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return;
    onAdd(trimmed);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {values.map((v, i) => (
            <li
              key={`${v}-${i}`}
              className="inline-flex items-center gap-1 rounded-full border border-parchment-400 bg-parchment-100 px-3 py-1 text-xs font-medium text-ink-700"
            >
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => onRemove(i)}
                className="text-ink-400 transition-colors hover:text-terra-600 cursor-pointer"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          maxLength={60}
          className="min-w-0 flex-1 rounded-xl border border-parchment-400 bg-parchment-50 px-3 py-2 text-sm text-ink-800 placeholder:text-ink-300 focus:border-moss-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={commit}
          disabled={!draft.trim()}
          className="shrink-0 rounded-xl border border-parchment-400 bg-parchment-100 px-4 py-2 font-display text-sm font-semibold text-ink-700 shadow-[0_2px_0_0_var(--color-parchment-400)] transition-all hover:bg-parchment-200 active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {addLabel}
        </button>
      </div>
    </div>
  );
}
