import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "accent" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-moss-500 text-parchment-50 border-moss-700 shadow-[0_2px_0_0_var(--moss-700)] hover:bg-moss-600 active:translate-y-[2px] active:shadow-none",
  secondary:
    "bg-parchment-100 text-ink-700 border-parchment-400 shadow-[0_2px_0_0_var(--color-parchment-400)] hover:bg-parchment-200 active:translate-y-[2px] active:shadow-none",
  accent:
    "bg-moss-100 text-moss-700 border-moss-400 shadow-[0_2px_0_0_var(--moss-400)] hover:bg-moss-300 hover:text-ink-900 active:translate-y-[2px] active:shadow-none",
  danger:
    "bg-terra-500 text-parchment-50 border-terra-700 shadow-[0_2px_0_0_var(--color-terra-700)] hover:bg-terra-600 active:translate-y-[2px] active:shadow-none",
  ghost:
    "bg-transparent text-ink-500 border-transparent hover:bg-parchment-200/70",
};

const sizes: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 gap-2 rounded-xl",
  lg: "text-base px-6 py-3.5 gap-2 rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center border font-display font-semibold tracking-wide transition-all duration-100 select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
