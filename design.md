# Design Rules — Life RPG

> Single source of truth for every UI decision in this repo.
> Based on "Premium SaaS UI Design Rules" by Olly Rosewell
> ("How I Design SaaS That Looks EXPENSIVE"), adapted to this product.
> Every AI session MUST follow this file instead of inventing new systems.

---

## Part 0 — Life RPG specifics (binds the rules below to our tokens)

### Palette

| Family | Role | Notes |
|---|---|---|
| `parchment-*` | Neutral surfaces | body bg, panels, borders, dividers |
| `ink-*` | Text | ink-900 headings, ink-700 body, ink-400/500 quiet meta |
| `moss-*` | Primary accent | CTAs, selected states, XP bars, links — **theme-swappable** via `--moss-*` runtime vars + `[data-theme]` on `<html>` (green/blue/purple/pink/orange) |
| `terra-*` | HP + danger only | HP bar, destructive buttons, warnings that mean harm |
| `plum-*` | Focus stat only | Focus bar and nothing else |
| `gold-*` | Currency + achievement only | coin balances, prices, streak flame highlight, trophies |

Rule: color communicates, never decorates. If a color carries no meaning, use parchment/ink instead.

### Type

- Display/headings: Quicksand (`font-display`) bold
- Body/UI: Be Vietnam Pro (`font-sans`)
- Numbers/stats: JetBrains Mono (`font-mono`)
- Small uppercase labels: `text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400` — sans-serif, never display serif

### Geometry

- Cards/panels: `rounded-xl` / `rounded-2xl` (via `.panel`, radius 1rem)
- Buttons: `sm` → `rounded-lg`, `md/lg` → `rounded-xl`; height from the Button sizes only
- Chips/badges: `rounded-full`
- Similar components always share geometry

### Icons

Lucide only (`lucide-react`). No emoji anywhere in UI chrome. Emojis inside seed/shop item data are art, not controls.

### Action terminology

One verb per action across all screens:

| Action | Label |
|---|---|
| Check off habit for today | Check in |
| Create skill | Add skill |
| Save profile changes | Save changes |
| Wipe local data | Reset Character |
| Begin/restart journey | Start your adventure |

Same action = same label = same destination.

### Page purposes (one question each)

| Page | Answers |
|---|---|
| `/` (landing) | What is this and how do I start? |
| `/dashboard` | What needs my attention today? |
| `/habits` | Which habits do I check in now? |
| `/skills` | How are my skills leveling? |
| `/projects` | Where is each project in its pipeline? |
| `/coach` | What does the coach say about today/yesterday? |
| `/reflect` | What does my history look like? |
| `/marketplace` | What can I spend coins on? |
| `/log` | What happened recently? |
| `/settings` | How do I configure character, AI key, theme? |

Anything that doesn't serve the page's question gets removed or moved.

### States

- Loading: never blank — skeleton/spinner within one paint (see `GameLoading`)
- Empty: say what's empty, why, and give the next action button
- Destructive: confirm inline first ("Really erase everything?" pattern); no window.confirm
- Completion: brief confirmation message after saves ("Saved ✓")

---

## 1. Core Philosophy

Design the interface to help the user finish a job, not to make the screen look finished.
AI tools optimize for a screen that looks complete; we optimize for a screen that makes the user's task obvious and easy.

Ask of every element:

- What is shown? What is hidden? What gets emphasis?
- What is interactive? What gets color?
- What is repeated? What can be removed?

## 2. Pre-Ship Checklist

1. Remove visual decoration that carries no information
2. Icons, not emojis, from one system
3. Restrained palette; color only where it communicates
4. One primary purpose per page
5. No repeated info or unnecessary KPIs
6. Compress dense cards; secondary actions behind menus
7. Consistent spacing + typography scale
8. Clear hierarchy — every screen has a subject
9. Design around user intent
10. Test with ugly, real-world data
11. Design empty/loading/error states
12. Progressive onboarding
13. Make speed visible
14. Show users the value they created
15. Friction on destructive/irreversible actions
16. Animation only when it communicates
17. Landing messaging consistent; real product shown
18. Curate the visual system — don't add decoration

## 3. Remove "AI Slop" First

Predictable generated defaults to avoid together: saturated blue/purple, excessive gradients, glow effects, oversized shadows, decorative emoji, inconsistent radii, card overload, repeated KPI cards, too many colors, alternating landing layouts, badge/chip spam.

Design test: "If I remove this element, does the user lose information or functionality?" No → remove it.

## 4–7. Color System

- Neutral surfaces + one accent + muted semantics
- Never let the AI pick colors randomly; use the Part 0 mapping above
- Good color: status, priority, chart data, selection, primary CTA
- Bad color: every card/button/label, decorative gradients, arbitrary backgrounds

## 8–11. Pages, Cards, Density

- Each page answers exactly one question (see table above)
- Compress cards: primary info + value that matters; move secondary actions into an overflow menu
- Show what's necessary at lowest noise; reveal detail on demand
- Prefer modals for short forms; drawers only when content justifies space

## 12–13. Hierarchy + Typography

Every screen is a sentence with a subject. Use size/weight/color/space to lead the eye:

```
Welcome back            ← heading dominates
Recent Activity         ← section structure
3 tasks completed       ← value
Updated 2 min ago       ← quiet metadata
```

Define the type scale once (Part 0) and never deviate ad hoc.

## 14. Consistency Is a UX Feature

Same action, same name everywhere (Part 0 table). Same component, same sizes/radii/capitalization. Users feel friction they cannot explain when patterns change.

## 15. This File Is the Source of Truth

Do not redefine the design system per session. Follow this file. Extend it deliberately.

## 16–17. Intent First

Start from "what did the user come here to do?", then build the smallest interface for that job. Functionality expands when intent expands — never because there is empty space.

## 18–22. Real Data + States

Real data is ugly: long strings, missing values, zeros, hundreds of rows. Decide rules early (truncate with tooltip, stable icon containers). Empty states answer what/why/next. Loading shows evidence immediately (skeletons). Speed is aesthetic: immediate feedback beats marginally faster code.

## 23. Scoreboard, Not Just Tool

Show accumulated value prominently (XP earned, streak days, quests done). Don't make users compute their own progress.

## 24–25. Destructive + Completion

Destructive actions get inline confirmation; truly irreversible ones get typed confirmation. After meaningful actions show completion state (message/checkmark/undo).

## 26–27. Motion + Control

Meaningful motion stays (progress, transitions, skeletons, celebration); decorative motion goes (parallax, scrolljack, random fly-ins). Prefer explicit "Load more" over infinite scroll when control matters.

## 28–35. Landing Page

Communicate what/who/result/trust/next. Kill alternating template layouts; strong hero that breathes; real product imagery cropped to prove the point; bento over identical card rows; three-step story max; outcome copy over feature copy ("Turn your life into quests", not "Track habits"); one CTA language everywhere.

## 36–38. Visual Direction + Components

Near-white restrained surfaces, subtle borders, minimal shadows, one typeface family set, controlled type scale, consistent radius/buttons/icons, mostly neutral color with one accent. Buttons: one clear primary; quieter secondary; semantic destructive. Cards group meaning, not decoration. Tables/lists optimize for scanning: strong first column, quiet metadata, compact status dots.

## 39–40. QA + Audit

Test long names/titles, zero values, one/no records, many records, small/large screens, keyboard nav. Before shipping ask: intent obvious in seconds? colors meaningful? radii/shadows consistent? repeated KPIs gone? states designed? motion earning its place?

## 41. One-Line Philosophy

**When there is nothing useful left to remove, the interface is getting close to being right.**
