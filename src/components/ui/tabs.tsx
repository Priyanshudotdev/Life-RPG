"use client";

import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex gap-1 rounded-xl border border-parchment-400 bg-parchment-100 p-1",
        className
      )}
    >
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            "cursor-pointer rounded-lg px-3.5 py-1.5 font-display text-sm font-semibold transition-all",
            value === item.value
              ? "bg-moss-500 text-parchment-50 shadow-[0_2px_0_0_var(--color-moss-700)]"
              : "text-ink-500 hover:bg-parchment-200"
          )}
        >
          {item.label}
          {typeof item.count === "number" ? (
            <span
              className={cn(
                "ml-1.5 font-mono text-[11px]",
                value === item.value ? "text-parchment-200" : "text-ink-400"
              )}
            >
              {item.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
