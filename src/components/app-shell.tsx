"use client";

import {
  BookOpen,
  CalendarCheck,
  Coins,
  Compass,
  Hammer,
  LayoutDashboard,
  ScrollText,
  Settings,
  Sparkles,
  Store,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useGame } from "@/lib/store";
import { cn } from "@/lib/utils";

export const PRIMARY_NAV = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/coach", label: "Coach", short: "Coach", icon: Wand2 },
  { href: "/habits", label: "Habits", short: "Habits", icon: CalendarCheck },
  { href: "/skills", label: "Skills", short: "Skills", icon: Sparkles },
  { href: "/projects", label: "Projects", short: "Quests", icon: Hammer },
  { href: "/reflect", label: "Reflect", short: "Reflect", icon: BookOpen },
  { href: "/marketplace", label: "Market", short: "Market", icon: Store },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { player } = useGame();

  return (
    <div className="flex min-h-dvh">
      {/* Desktop nav rail */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-parchment-400 bg-parchment-100/80 px-4 py-6 backdrop-blur md:flex">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-moss-700 bg-moss-500 text-parchment-50 shadow-[0_2px_0_0_var(--moss-700)]">
            <Compass className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-ink-900">
            Life RPG
          </span>
        </Link>

        <nav className="flex flex-col gap-1">
          {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5 font-display text-sm font-semibold transition-all",
                  active
                    ? "border-moss-700 bg-moss-500 text-parchment-50 shadow-[0_2px_0_0_var(--moss-700)]"
                    : "border-transparent text-ink-500 hover:bg-parchment-200"
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1">
          <RailLink href="/log" active={pathname.startsWith("/log")} icon={<ScrollText className="h-4.5 w-4.5" />} label="Activity Log" />
          <RailLink href="/settings" active={pathname.startsWith("/settings")} icon={<Settings className="h-4.5 w-4.5" />} label="Settings" />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-parchment-400 bg-parchment-100/85 px-4 py-3 backdrop-blur md:px-8">
          <p className="font-display text-base font-bold text-ink-900 md:hidden">
            Life RPG
          </p>
          <p className="hidden font-display text-sm font-semibold text-ink-400 md:block">
            {greeting()}, {player?.name ?? "traveler"}
          </p>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-gold-400 bg-gold-100 px-3 py-1"
              title="Your coins"
            >
              <Coins className="h-3.5 w-3.5 text-gold-600" />
              <span className="font-mono text-sm font-bold text-gold-700">
                {player?.coins ?? 0}
              </span>
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-moss-500 bg-moss-500 px-3 py-1"
              title="Character level"
            >
              <span className="font-mono text-xs font-bold text-parchment-50">
                Lv. {player?.level ?? 1}
              </span>
            </span>
            <Link
              href="/log"
              aria-label="Activity log"
              className="grid h-9 w-9 place-items-center rounded-xl border border-parchment-400 bg-parchment-50 text-ink-500 transition-colors hover:bg-parchment-200 md:hidden"
            >
              <ScrollText className="h-4.5 w-4.5" />
            </Link>
            <Link
              href="/settings"
              aria-label="Settings"
              className="grid h-9 w-9 place-items-center rounded-xl border border-parchment-400 bg-parchment-50 text-ink-500 transition-colors hover:bg-parchment-200 md:hidden"
            >
              <Settings className="h-4.5 w-4.5" />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-parchment-400 bg-parchment-100/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {PRIMARY_NAV.map(({ href, short, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 py-2.5 font-display text-[10px] font-bold uppercase tracking-wide transition-colors"
            >
              <span
                className={cn(
                  "grid h-8 w-full max-w-12 place-items-center rounded-lg transition-colors",
                  active ? "bg-moss-100" : ""
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-moss-600" : "text-ink-400")} />
              </span>
              <span className={cn("max-w-full truncate", active ? "text-moss-600" : "text-ink-400")}>
                {short}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function RailLink({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 font-display text-sm font-semibold transition-all",
        active
          ? "border-parchment-400 bg-parchment-50 text-ink-700"
          : "border-transparent text-ink-400 hover:bg-parchment-200"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
