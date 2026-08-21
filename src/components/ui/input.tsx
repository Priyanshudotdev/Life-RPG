import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const base =
  "w-full rounded-xl border border-parchment-400 bg-parchment-50 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400/70 shadow-inner shadow-parchment-300/40 transition-colors focus:border-moss-500 focus:outline-none";

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, className)} {...props} />;
}

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, "resize-none", className)} {...props} />;
}

export function FieldLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <label className="font-display text-xs font-bold uppercase tracking-[0.12em] text-ink-500">
        {children}
      </label>
      {hint ? <span className="font-mono text-[11px] text-ink-400">{hint}</span> : null}
    </div>
  );
}
