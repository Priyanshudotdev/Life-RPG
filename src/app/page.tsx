import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Compass,
  Flame,
  Gamepad2,
  Hammer,
  HeartHandshake,
  Lock,
  Map,
  Play,
  Plus,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trophy,
} from "lucide-react";
import { Portrait } from "@/components/portrait";
import { ProgressBar } from "@/components/ui/segmented-bar";
import { Reveal } from "@/components/landing/reveal";
import { StartCta } from "@/components/landing/start-cta";
import { VideoModalButton } from "@/components/landing/video-modal";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cozy Tactics — Habit Tracking as a Game",
  description:
    "Turn daily routines into an RPG adventure. Character creation, XP progression, AI learning paths, and cozy aesthetics. No pressure, just growth.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Cozy Tactics",
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  description:
    "A cozy, local-first habit RPG: turn goals into quests, habits into streaks, and skills into levels.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function LandingPage() {
  return (
    <div className={`${playfair.variable} bg-parchment-50 text-ink-700`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteNav />
      <main>
        <Hero />
        <Problem />
        <FeatureGrid />
        <VideoBand />
        <Stories />
        <HowItWorks />
        <Pricing />
        <FinalCta />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}

/* ── Shared bits ─────────────────────────────────────────── */

function SectionHead({
  title,
  children,
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <h2 className="font-serif-display text-3xl font-semibold leading-[1.12] tracking-tight text-ink-900 md:text-[2.75rem]">
        {title}
      </h2>
      {children && (
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ink-500">{children}</p>
      )}
    </Reveal>
  );
}

function DarkPill({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 font-display text-sm font-bold text-parchment-50 transition-all hover:-translate-y-0.5 hover:bg-ink-700 hover:shadow-lift active:scale-[0.98] ${className}`}
    >
      {children}
    </a>
  );
}

/** Layered rolling hills with scattered flowers — the page's nature motif. */
function Hills({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 320"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M0 220 C240 140 420 250 720 200 C1020 150 1200 230 1440 170 L1440 320 L0 320 Z"
        fill="#aebd85"
      />
      <path
        d="M0 260 C300 190 520 290 800 245 C1080 200 1260 275 1440 235 L1440 320 L0 320 Z"
        fill="#8ba05e"
      />
      <path
        d="M0 300 C360 245 640 320 960 285 C1200 258 1330 300 1440 280 L1440 320 L0 320 Z"
        fill="#6e7f4f"
      />
      {/* flowers */}
      <g>
        <circle cx="180" cy="238" r="5" fill="#c05f3c" />
        <circle cx="205" cy="228" r="3.5" fill="#dfc27a" />
        <circle cx="392" cy="212" r="4.5" fill="#ecdfed" />
        <circle cx="418" cy="222" r="3" fill="#d07a55" />
        <circle cx="668" cy="196" r="5" fill="#c9973b" />
        <circle cx="694" cy="206" r="3.5" fill="#f6e0d4" />
        <circle cx="905" cy="182" r="4" fill="#c19cc3" />
        <circle cx="1120" cy="204" r="5" fill="#c05f3c" />
        <circle cx="1148" cy="214" r="3" fill="#ecd9a4" />
        <circle cx="1310" cy="188" r="4" fill="#ecdfed" />
      </g>
      {/* birds */}
      <g stroke="#6d6450" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M1010 70 q8 -8 16 0 q8 -8 16 0" />
        <path d="M1080 96 q6 -6 12 0 q6 -6 12 0" />
        <path d="M1150 60 q5 -5 10 0 q5 -5 10 0" />
      </g>
    </svg>
  );
}

/* ── Nav ─────────────────────────────────────────────────── */

function SiteNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <nav className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <a href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-moss-700 bg-moss-500 text-parchment-50 shadow-[0_2px_0_0_var(--color-moss-700)]">
            <Compass className="h-5 w-5" />
          </span>
          <span className="font-serif-display text-xl font-bold tracking-tight text-ink-900">
            Cozy Tactics
          </span>
        </a>
        <div className="hidden items-center gap-7 font-display text-sm font-semibold text-ink-500 lg:flex">
          <a href="#features" className="transition-colors hover:text-ink-900">Features</a>
          <a href="#tour" className="transition-colors hover:text-ink-900">Tour</a>
          <a href="#stories" className="transition-colors hover:text-ink-900">Stories</a>
          <a href="#faq" className="transition-colors hover:text-ink-900">FAQ</a>
        </div>
        <DarkPill href="/onboarding" className="max-lg:hidden">
          Start your adventure
        </DarkPill>
        <a
          href="/dashboard"
          className="font-display text-sm font-bold text-ink-700 underline decoration-moss-400 decoration-2 underline-offset-4 lg:hidden"
        >
          Open app
        </a>
      </nav>
    </header>
  );
}

/* ── 1 · Hero ────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <Hills className="pointer-events-none absolute inset-x-0 bottom-0 h-[46vh] w-full" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-5 pb-[38vh] pt-32 text-center md:pt-36">
        <p className="mb-5 font-display text-xs font-bold uppercase tracking-[0.22em] text-moss-600">
          · A habit tracker disguised as an RPG ·
        </p>
        <h1 className="font-serif-display text-5xl font-semibold leading-[1.08] pb-1 tracking-tight text-ink-900 md:text-7xl">
          Play your way to{" "}
          <em className="text-moss-600">better habits.</em>
        </h1>
        <p className="mt-6 max-w-xl text-lg italic leading-relaxed text-ink-500">
          Turn daily routines into an RPG adventure. Level up, earn rewards,
          and grow without the pressure.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <StartCta />
          <VideoModalButton />
        </div>

        {/* Peeking companion */}
        <div className="absolute -right-2 bottom-[34vh] hidden rotate-6 lg:block">
          <div className="relative rounded-2xl border border-parchment-400 bg-parchment-50 p-2.5 shadow-lift">
            <Portrait portraitId="bard" className="h-20 w-20 rounded-xl" />
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-gold-500 bg-gold-500 px-2 py-0.5 font-mono text-[10px] font-bold text-ink-900">
              Lv. 12 · Bard
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 2 · Positioning ─────────────────────────────────────── */

function Problem() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32">
      <SectionHead title="Habit tracking feels like work.">
        Apps guilt you with streaks, overwhelm you with features, or make you
        compete with strangers. Cozy Tactics is different.
      </SectionHead>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <Reveal className="md:col-span-1">
          <div className="panel h-full p-6">
            <Trophy className="h-6 w-6 text-gold-600" />
            <h3 className="mt-4 font-display text-base font-bold text-ink-900">
              Not a competition
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              Your progress is yours alone. No leaderboards, no judgment.
            </p>
          </div>
        </Reveal>
        <Reveal delay={80} className="md:col-span-1">
          <div className="panel h-full p-6">
            <Gamepad2 className="h-6 w-6 text-plum-500" />
            <h3 className="mt-4 font-display text-base font-bold text-ink-900">
              Actually fun
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              Gain XP, level up your character, unlock rewards. Why shouldn&apos;t
              growth feel good?
            </p>
          </div>
        </Reveal>
        <Reveal delay={160} className="md:col-span-1">
          <div className="panel h-full overflow-hidden">
            <div className="flex items-center gap-3 border-b border-parchment-300 bg-gradient-to-br from-moss-50 to-parchment-50 p-5">
              <Portrait portraitId="ranger" className="h-14 w-14 shrink-0 rounded-xl" />
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-ink-900">
                  Ranger · Lv. 8
                </p>
                <ProgressBar pct={62} tone="moss" className="mt-2 h-2" />
              </div>
            </div>
            <div className="p-6">
              <Sprout className="h-6 w-6 text-moss-500" />
              <h3 className="mt-4 font-display text-base font-bold text-ink-900">
                Sustainable
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                Designed for life, not burnout. Take breaks without guilt.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 3 · Feature bento ───────────────────────────────────── */

function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-24 md:px-8 md:pb-32">
      <SectionHead title="Everything you need to grow.">
        Seven cozy systems working together — game mechanics doing the heavy
        lifting, gentle design keeping it kind.
      </SectionHead>

      <div className="mt-12 grid gap-6 md:grid-cols-4">
        <Reveal className="md:col-span-2">
          <BentoCell title="Create your hero">
            Design a character that represents who you&apos;re becoming. Pick a
            portrait, name them, set your goals. Your avatar grows with you.
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <Portrait portraitId="ranger" className="h-12 w-12 -rotate-3 rounded-xl border border-parchment-400 shadow-panel md:h-16 md:w-16" />
              <Portrait portraitId="bard" className="h-16 w-16 rounded-xl border border-parchment-400 shadow-lift md:h-20 md:w-20" />
              <Portrait portraitId="scholar" className="h-12 w-12 rotate-3 rounded-xl border border-parchment-400 shadow-panel md:h-16 md:w-16" />
              <span className="inline-flex items-center gap-1.5 self-center rounded-full border border-plum-300 bg-plum-100 px-3 py-1 text-xs font-bold text-plum-600">
                <Plus className="h-3 w-3" /> 6 more
              </span>
            </div>
          </BentoCell>
        </Reveal>

        <Reveal delay={80} className="md:col-span-2">
          <BentoCell title="Your schedule, your rules">
            Set habits for daily, weekdays, weekends, weekly, biweekly, or any
            custom mix. Notion-style scheduling — no rigid templates.
            <div className="mt-5 space-y-2.5">
              <div className="flex gap-1.5">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <span
                    key={i}
                    className={`grid h-8 flex-1 place-items-center rounded-lg border font-mono text-xs font-bold ${
                      [1, 3, 5].includes(i)
                        ? "border-moss-600 bg-moss-500 text-parchment-50"
                        : "border-parchment-300 bg-white/50 text-ink-400"
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5">
                {["Morning", "Evening"].map((t, i) => (
                  <span
                    key={t}
                    className={`flex-1 rounded-lg border px-3 py-1.5 text-center text-xs font-bold ${
                      i === 0
                        ? "border-gold-500 bg-gold-100 text-gold-700"
                        : "border-parchment-300 bg-white/50 text-ink-400"
                    }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </BentoCell>
        </Reveal>

        <Reveal className="md:col-span-4">
          <div className="grid h-full gap-6 overflow-hidden rounded-2xl border border-parchment-400 bg-gradient-to-br from-moss-50 via-parchment-50 to-gold-100/50 p-6 shadow-panel md:grid-cols-2 md:p-8">
            <div className="flex flex-col justify-center">
              <h3 className="font-serif-display text-2xl font-semibold text-ink-900 md:text-3xl">
                Level up, literally.
              </h3>
              <p className="mt-3 leading-relaxed text-ink-500">
                Every completed habit earns XP. XP becomes levels. Levels become
                a character that looks suspiciously like the progress you&apos;re
                actually making.
              </p>
              <div className="mt-5 rounded-xl border border-parchment-300 bg-white/60 px-4 py-3">
                <p className="text-sm text-ink-700">
                  Checked in <strong>&ldquo;Morning stretch&rdquo;</strong> — 4-day streak!
                </p>
                <p className="mt-1 flex items-center gap-1 font-mono text-xs font-bold text-moss-600">
                  <Sparkles className="h-3 w-3" /> +28 XP · +10 coins
                </p>
                <ProgressBar pct={64} tone="gold" className="mt-3 h-2.5" />
              </div>
            </div>
            <div className="flex items-end justify-center gap-3 md:gap-6">
              {[
                { id: "monk", lv: 1, h: "h-12 md:h-16" },
                { id: "ranger", lv: 5, h: "h-16 md:h-24" },
                { id: "bard", lv: 10, h: "h-24 md:h-32" },
              ].map((p) => (
                <div key={p.lv} className="flex flex-col items-center gap-2">
                  <Portrait portraitId={p.id} className={`${p.h} w-auto aspect-square rounded-xl border border-parchment-400 shadow-panel`} />
                  <span className="rounded-full border border-gold-500 bg-gold-500 px-2 py-0.5 font-mono text-xs font-bold text-ink-900 md:px-2.5">
                    Lv. {p.lv}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal className="md:col-span-4">
          <div className="grid h-full gap-6 overflow-hidden rounded-2xl border border-plum-300 bg-gradient-to-br from-plum-100/60 via-parchment-50 to-parchment-50 p-6 shadow-panel md:grid-cols-[1fr_1.2fr] md:p-8">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-plum-400 bg-plum-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-plum-600">
                <Map className="h-3.5 w-3.5" /> Journey
              </span>
              <h3 className="mt-4 font-serif-display text-2xl font-semibold text-ink-900 md:text-3xl">
                AI-powered learning roadmaps.
              </h3>
              <p className="mt-3 leading-relaxed text-ink-500">
                Want to learn DSA? Build a website? Name your goal and get a
                personalized path of milestones you check off one by one.
              </p>
              <p className="mt-3 text-xs italic text-ink-400">
                Roadmaps work with or without AI — build your own by hand if you
                prefer.
              </p>
            </div>
            <ol className="relative space-y-2.5 before:absolute before:left-[15px] before:top-4 before:h-[calc(100%-16px)] before:w-0.5 before:bg-plum-300/70">
              <li className="relative flex items-center gap-3 rounded-xl border border-parchment-300 bg-white/70 px-4 py-3 opacity-75">
                <CheckCircle2 className="z-10 h-5 w-5 shrink-0 rounded-full bg-white text-moss-600" />
                <span className="text-sm text-ink-500 line-through">
                  Big-O basics
                </span>
              </li>
              <li className="relative flex items-center gap-3 rounded-xl border border-moss-500 bg-moss-50 px-4 py-3 shadow-panel">
                <Play className="z-10 h-5 w-5 shrink-0 rounded-full bg-white text-moss-600" />
                <span className="min-w-0 flex-1 truncate font-display text-sm font-bold text-ink-900">
                  Arrays &amp; hashing drills
                </span>
                <span className="shrink-0 rounded-full border border-moss-400 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-moss-600">
                  Current
                </span>
              </li>
              <li className="relative flex items-center gap-3 rounded-xl border border-parchment-300 bg-white/50 px-4 py-3 opacity-60">
                <Lock className="z-10 h-5 w-5 shrink-0 rounded-full bg-white text-ink-400" />
                <span className="text-sm text-ink-500">
                  Trees &amp; graphs
                </span>
              </li>
            </ol>
          </div>
        </Reveal>

        <Reveal className="md:col-span-2">
          <BentoCell title="Reflect & celebrate">
            Weekly and monthly reports show your progress, streaks, and
            patterns. Celebrate wins, learn from setbacks.
            <div className="mt-5 rounded-xl border border-parchment-300 bg-white/60 p-4">
              <p className="font-mono text-xs font-bold text-ink-400">This week</p>
              <div className="mt-3 flex h-16 items-end gap-2">
                {[35, 55, 20, 80, 65, 95, 50].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`flex-1 rounded-md ${i === 5 ? "bg-gold-400" : "bg-moss-300"}`}
                  />
                ))}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-terra-600">
                <Flame className="h-3.5 w-3.5" /> 6-day best streak
              </p>
            </div>
          </BentoCell>
        </Reveal>

        <Reveal delay={80} className="md:col-span-1">
          <BentoCell title="Make it yours" tint="bg-parchment-100">
            Swap cozy banners whenever the mood shifts. It&apos;s your space.
            <div className="mt-5 space-y-2">
              <div className="h-7 rounded-lg bg-gradient-to-r from-moss-300 to-moss-400" />
              <div className="h-7 rounded-lg bg-gradient-to-r from-gold-200 to-terra-300" />
              <div className="h-7 rounded-lg bg-gradient-to-r from-plum-300 to-plum-100" />
            </div>
          </BentoCell>
        </Reveal>

        <Reveal delay={160} className="md:col-span-1">
          <div className="flex h-full flex-col rounded-2xl border border-moss-700 bg-moss-600 p-6 text-parchment-50 shadow-panel">
            <ShieldCheck className="h-6 w-6 text-parchment-200" />
            <h3 className="mt-4 font-display text-base font-bold">
              Never lose your progress
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-parchment-200">
              Your data lives on your device. Works offline, zero data loss.
              Your habits stay yours.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function BentoCell({
  title,
  children,
  tint = "",
}: {
  title: string;
  children: React.ReactNode;
  tint?: string;
}) {
  return (
    <div className={`panel h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-7 ${tint}`}>
      <h3 className="font-serif-display text-xl font-semibold text-ink-900 md:text-2xl">
        {title}
      </h3>
      <div className="mt-2.5 text-sm leading-relaxed text-ink-500">{children}</div>
    </div>
  );
}

/* ── 4 · Video band ──────────────────────────────────────── */

function VideoBand() {
  return (
    <section id="tour" className="bg-parchment-100 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHead title="See it in action.">
          Onboarding, check-ins, level-ups, roadmaps, and the weekly reflect —
          the whole loop, start to finish.
        </SectionHead>
        <Reveal className="mt-12">
          <button
            type="button"
            aria-label="Watch the product tour"
            className="group relative block aspect-video w-full cursor-pointer overflow-hidden rounded-[1.75rem] border border-parchment-400 shadow-lift transition-transform duration-300 hover:-translate-y-1"
          >
            <span className="absolute inset-0 bg-gradient-to-b from-moss-100 to-moss-300" aria-hidden="true" />
            <Hills className="absolute inset-x-0 bottom-0 h-2/5 w-full" aria-hidden="true" />
            <span className="absolute right-6 top-6 hidden rotate-3 sm:block">
              <span className="block rounded-xl border border-parchment-400 bg-parchment-50/95 px-4 py-2.5 text-left shadow-lift">
                <span className="block text-xs text-ink-500">
                  Checked in &ldquo;Read 20 pages&rdquo;
                </span>
                <span className="mt-0.5 block font-mono text-xs font-bold text-moss-600">
                  +20 XP · +10 coins
                </span>
              </span>
            </span>
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-20 w-20 place-items-center rounded-full border border-moss-700 bg-ink-900 text-parchment-50 shadow-lift transition-transform duration-300 group-hover:scale-110">
                <Play className="ml-1 h-8 w-8 fill-current" />
              </span>
            </span>
          </button>
        </Reveal>
        <div className="mt-8 text-center">
          <VideoModalButton className="border-transparent bg-white/70 shadow-panel" />
        </div>
      </div>
    </section>
  );
}

/* ── 5 · Stories ─────────────────────────────────────────── */

const STORIES = [
  {
    portrait: "scholar",
    who: "Maya · The Student",
    quote:
      "I used to quit after two weeks. Now I’m learning DSA consistently through my roadmap. Level 12 and growing.",
  },
  {
    portrait: "monk",
    who: "Daniel · The Parent",
    quote:
      "Habits for exercise, reading, cooking. My character evolved so much — and honestly, so did I.",
  },
  {
    portrait: "smith",
    who: "Alex · The Freelancer",
    quote:
      "Streaks keep me accountable without the guilt. I actually look forward to opening the app.",
  },
];

function Stories() {
  return (
    <section id="stories" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 md:px-8 md:py-32">
      <SectionHead title="Players, leveling up for real.">
        Early adventurers, in their own words.
      </SectionHead>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {STORIES.map((s, i) => (
          <Reveal key={s.who} delay={i * 90}>
            <figure className="panel flex h-full flex-col p-6">
              <blockquote className="flex-1">
                <p className="leading-relaxed text-ink-700">{s.quote}</p>
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-parchment-300 pt-4">
                <Portrait portraitId={s.portrait} className="h-11 w-11 rounded-xl" />
                <span className="font-display text-sm font-bold text-ink-900">
                  {s.who}
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── 6 · How it works ────────────────────────────────────── */

const STEPS = [
  { icon: Sparkles, title: "Create", body: "Build your character, set your name and goals." },
  { icon: CalendarRange, title: "Track", body: "Check off daily habits, watch XP roll in." },
  { icon: Hammer, title: "Grow", body: "Level up, earn coins, evolve your character." },
  { icon: HeartHandshake, title: "Reflect", body: "Weekly insights on what worked and what didn't." },
  { icon: RotateCw, title: "Repeat", body: "Sustainable habits. No pressure, ever." },
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 md:px-8 md:pb-32">
      <SectionHead title="How it works." />
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 70}>
            <div className="relative flex flex-col items-start gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-parchment-400 bg-white/70 text-moss-600 shadow-panel">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-sm font-bold text-parchment-500">
                  0{i + 1}
                </span>
              </div>
              <div className="rule-dashed hidden w-full lg:absolute lg:-bottom-10 lg:block" aria-hidden="true" />
              <h3 className="pt-1 font-display text-base font-bold text-ink-900">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-500">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── 7 · Pricing ─────────────────────────────────────────── */

function Pricing() {
  return (
    <section className="mx-auto max-w-4xl px-5 pb-24 md:px-8 md:pb-32">
      <SectionHead title="Free, genuinely.">
        The core game — habits, character, quests, journeys, reports — is fully
        playable for free. No trial timers.
      </SectionHead>
      <Reveal className="mt-12">
        <div className="panel grid gap-8 p-7 md:grid-cols-[1.4fr_1fr] md:p-9">
          <div>
            <p className="flex items-baseline gap-2">
              <span className="font-serif-display text-4xl font-semibold text-ink-900">
                $0
              </span>
              <span className="font-display text-sm font-bold uppercase tracking-wide text-moss-600">
                Free forever
              </span>
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-ink-700">
              {[
                "Unlimited habits, skills, and quests",
                "Character creation & progression",
                "Journey roadmaps (AI or manual)",
                "Weekly & monthly reflect reports",
                "Local-first storage — private by default",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-moss-500" />
                  {item}
                </li>
              ))}
            </ul>
            <DarkPill href="/onboarding" className="mt-7">
              Start your adventure <ArrowRight className="h-4 w-4" />
            </DarkPill>
          </div>
          <div className="rounded-2xl border border-dashed border-parchment-400 bg-parchment-100/60 p-6">
            <p className="font-display text-sm font-bold uppercase tracking-wide text-ink-400">
              Someday · Pro
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              Extra cosmetics, deeper analytics, and shared journeys are ideas
              for later. If they ever arrive, the free game stays whole.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ── 8 · Final CTA ───────────────────────────────────────── */

function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-parchment-50 to-moss-100 px-5 py-28 text-center md:py-36">
      <Hills className="pointer-events-none absolute inset-x-0 bottom-0 h-48 w-full opacity-90" />
      <div className="relative mx-auto max-w-2xl">
        <Reveal>
          <h2 className="font-serif-display text-4xl font-semibold leading-[1.1] pb-1 tracking-tight text-ink-900 md:text-6xl">
            Ready to turn your habits{" "}
            <em className="text-moss-700">into a game?</em>
          </h2>
          <p className="mx-auto mt-5 max-w-md leading-relaxed text-ink-500">
            Two minutes to create your character. A lifetime of quiet, steady
            leveling up.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <StartCta />
            <VideoModalButton />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 9 · FAQ ─────────────────────────────────────────────── */

const FAQS = [
  {
    q: "Do I need to be online to use it?",
    a: "No. Cozy Tactics runs entirely in your browser and stores everything locally, so it works offline. Your save file is on your device, not a server.",
  },
  {
    q: "Is my data safe?",
    a: "Your habits live in your browser's local database and never leave your device. If you add a Gemini key for the AI Coach, that key stays in your browser too.",
  },
  {
    q: "What if I miss a day?",
    a: "Nothing breaks. Streaks bend rather than shatter, scheduled habits simply skip their off-days, and the Coach is contractually forbidden from guilting you.",
  },
  {
    q: "Can I import habits from another app?",
    a: "Not yet. Recreating a handful of habits takes about a minute, and skills accept anything you type — the suggestion list is just a starting point.",
  },
  {
    q: "Can I play with friends?",
    a: "Cozy Tactics is single-player by design today. Shared journeys and co-op quests are on the roadmap for someday.",
  },
  {
    q: "How much does it cost?",
    a: "Zero. The entire game is free while we're in the open. No trials, no locked features, no ads.",
  },
];

function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-24 md:px-8 md:py-32">
      <SectionHead title="Fair questions." />
      <div className="mt-12 space-y-3">
        {FAQS.map((f) => (
          <details
            key={f.q}
            className="group rounded-2xl border border-parchment-400 bg-parchment-50 shadow-panel open:bg-white/70"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 font-display text-sm font-bold text-ink-900 [&::-webkit-details-marker]:hidden">
              {f.q}
              <Plus className="h-4 w-4 shrink-0 text-moss-600 transition-transform duration-300 group-open:rotate-45" />
            </summary>
            <p className="px-6 pb-5 text-sm leading-relaxed text-ink-500">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ── 10 · Footer ─────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-parchment-300 bg-parchment-50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 py-12 md:flex-row md:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-moss-700 bg-moss-500 text-parchment-50">
            <Compass className="h-4.5 w-4.5" />
          </span>
          <p className="font-serif-display text-base font-bold text-ink-900">
            Cozy Tactics
            <span className="ml-2 hidden font-sans text-xs font-medium text-ink-400 sm:inline">
              Habit tracking as a game, not a chore.
            </span>
          </p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-display text-sm font-semibold text-ink-500">
          <a href="#features" className="hover:text-ink-900">Features</a>
          <a href="#tour" className="hover:text-ink-900">Tour</a>
          <a href="#faq" className="hover:text-ink-900">FAQ</a>
          <a
            href="https://github.com/Priyanshudotdev/Life-RPG"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-ink-900"
          >
            GitHub
          </a>
        </nav>
        <p className="text-xs text-ink-400">© 2026 Cozy Tactics</p>
      </div>
    </footer>
  );
}
