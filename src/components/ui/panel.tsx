import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Panel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("panel p-5", className)} {...props} />;
}

export function PanelTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-400",
        className
      )}
    >
      {children}
    </h2>
  );
}
