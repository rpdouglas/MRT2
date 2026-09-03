# Dashboard — `/dashboard`

**Source:** `src/pages/Dashboard.tsx` + `SobrietyHero.tsx`, `DynamicAnchorWidget.tsx`, `BentoCard.tsx`, `NotificationBanner.tsx`, `VibrantHeader.tsx`, `useUserProfile.ts`, `lib/milestones.ts`, `lib/heroColors.ts`, `lib/versioning.ts`
**Personas:** All — this is the app's home screen and first thing every user sees after unlocking the vault.
**Tier:** Free. No premium gating on this screen itself.
**Zero-knowledge status:** Reads `users/{uid}` (unencrypted profile metadata) and, via `SobrietyHero`, one most-recent doc from `insights` (also unencrypted — just a summary string, not raw journal/workbook content) for the share-image quote. Does **not** query `journals`, `tasks`, or `workbook_answers` directly (see PROJ-76 note below) — nothing here requires the vault to be unlocked to *render* the shell. The one exception: `DynamicAnchorWidget`'s "Check-In" card opens a full `JournalEditor` inside a `<VaultGate>`, so completing a check-in from the Dashboard can trigger a PIN prompt even though the shell itself never does.

## What it does

The landing hub after login/unlock. Shows sobriety duration (with financial-savings tracking, a shareable milestone image, and an inline accent-color picker), a time-aware Check-In/Daily Reading action pair, a backup reminder, an update notification, and a 2×6 grid of entry tiles into the app's six main modules (Journal, Tasks, Vitality, Workbooks, Games, Tools).

It is deliberately *not* a stats dashboard anymore — see the PROJ-76 history below.

## How it works

Layout is three fixed/scroll regions stacked in a flex column (`h-[100dvh]`):

1. **Fixed header** — `VibrantHeader` with a randomly-selected slogan from `src/data/slogans.ts` (re-rolled once per mount, not per visit in any tracked sense), themed via `getHeroColorTheme(userProfile.heroColor)` (PROJ-56 hero color themes — user-selectable accent palette).
2. **Floating hero** — `SobrietyHero`, given `userProfile.sobrietyDate` and the full profile. This component is considerably more than a duration counter (the "How it works" description below was previously too thin here — expanded after re-reading the component directly):
   - **Empty state:** if no `sobrietyDate` is set, renders a "Begin the Journey" prompt instead of counters, with no link to Profile from the card itself (the surrounding Dashboard's other affordances are the path there).
   - **Duration:** Years/Months/Days computed via `calculateSobrietyDuration()` (`lib/dateUtils.ts`), not the Dashboard's own `daysClean` calc — the Dashboard computes `daysClean` separately, purely to drive its own milestone-confetti effect (below); the two calculations are independent, not shared.
   - **Financial savings:** if `userProfile.substanceCost`/`costFrequency` are set, shows total money saved since the sobriety date (`calculateSavings()`, `lib/financial.ts`) in the user's `currencySymbol`. If unset, shows a "Setup Financial Freedom" link to `/profile` instead of a dollar figure.
   - **Inline hero color picker:** a swatch button on the card itself (not just a display of the theme chosen elsewhere) opens a popover to change `heroColor` right from the Dashboard — `Escape`-to-close for keyboard users, since the backdrop-click dismiss is mouse/touch only.
   - **Milestone → Share loop:** on a milestone day, the card's footer swaps from the money/level row to a pulsing "🎉 [Milestone] Milestone! Tap Share" banner. The Share button (top-right, always visible but only pulsing on a milestone) exports the hero card as a PNG via `useShareImage` (html-to-image under the hood) — the export layout swaps in a milestone medallion image, a quote pulled from the user's own most recent `insights` doc, and a "myrecoverytoolkit.ca" watermark, then hands off to the native share sheet. This is the app's one small built-in viral/growth loop, and it lives entirely on this widget.
   - **Gamification props it supports but the Dashboard doesn't use:** `SobrietyHero` accepts optional `levelData`/`archetype` props that would render a Rank/Level/XP row — but `Dashboard.tsx` never passes them, consistent with the PROJ-76 relocation described below. The component still supports them for a caller that wants them; the Dashboard just isn't that caller.
3. **Scrollable body**, top to bottom:
   - `NotificationBanner` — push notification opt-in (PROJ-26). Respects iOS PWA constraints (only prompts once running standalone, since Web Push doesn't work in iOS Safari outside an installed PWA) and a per-user `localStorage` dismissal flag.
   - **Changelog toast** — inline banner (not a component), shown when `userProfile.lastSeenBuildHash` differs from the current build's hash (`useBuildInfo()`). First-ever load just silently records the hash; a hash *change* triggers the toast and links out to the published changelog (`https://rpdouglas.github.io/MRT2/support/changelog`). Dismiss just hides the toast for that session (the hash was already persisted).
   - **Backup alert** — amber banner shown when `!driveAccessToken` (no live Google Drive session) AND (`lastExportAt` is unset OR older than 7 days). Links to `/profile`.
   - `DynamicAnchorWidget` — two pill-shaped action cards, not a generic quick-action bar (PROJ-41):
     - **Check-In card:** icon and label swap by time of day (sun/amber "Morning/Afternoon Check-In" vs. moon/violet "Evening/Night Check-In"). A red exclamation badge appears when `useAnchorStatus()` reports `needsCheckIn`; a small lock icon overlays the card when the vault is locked. Tapping it opens a full-screen `JournalEditor` overlay (not a navigation to `/journal`) wrapped in `<VaultGate>`, pre-filled with a time-of-day-specific prompt (`TIME_BASED_PROMPTS`) and tagged `["Anchor", timeOfDay]`.
     - **Daily Reading card:** tapping the main body opens an in-app `ReadingModal` over the user's preferred fellowship/modality readings (falls back to opening the fellowship's external reading URL if none are available in Firestore yet), and records `anchorSettings.lastReadingDate` on the user doc. A caret opens a dropdown to jump straight to any fellowship's external reading. Reading a passage inside the modal can hand off directly into a Journal entry pre-filled with that reading's title/reflection text (`handleJournalFromReading`) — a reading-to-reflection flow that doesn't otherwise show up anywhere in the Dashboard's own code. A red badge here mirrors the Check-In card's, driven by `needsReading`.
   - **6-tile bento grid** — `BentoCard` × 6, statically defined in `BENTO_TILES` at module scope: Journal, Tasks, Vitality, Workbooks, Games, Tools. Each tile is just an icon + title + one-line caption + `Link` — no live stat numbers.
4. **Milestone confetti** — a `useEffect` keyed on `daysClean` checks `getMilestone(daysClean)`; if it's a milestone day, fires `react-confetti` for ~10s (unless `prefers-reduced-motion` is set — PROJ-98 Phase 2 explicitly skips the animation for those users, since the medallion/banner in `SobrietyHero` itself is the actual reward signal). Guarded by a `sessionStorage` flag (`mrt_milestone_{n}_played`) so it fires once per session per milestone, not once per render.

### PROJ-76: tiles used to show live stats

Until PROJ-76, all six bento tiles carried live numbers (Journal streak, Habit Fire, Vitality Rhythm, Workbook Wisdom) and the Dashboard queried `journals`/`tasks`/`workbook_answers` to compute them. That was relocated to Profile → Achievements to cut cognitive load; the Dashboard's job narrowed to pure navigation + the sobriety hero + the anchor widget. If you're reading an older mental model of this screen (or an LLM trained on an earlier version of this repo) that describes stat numbers on the tiles, that's stale — the current code has none.

## Data model

| Collection | Encrypted? | What this screen reads/writes |
|---|---|---|
| `users/{uid}` | ❌ No | Reads `sobrietyDate`, `heroColor`, `lastExportAt`, `lastSeenBuildHash`, `substanceCost`/`costFrequency`/`currencySymbol` (financial savings), `anchorSettings.defaultFellowship`. Writes `lastSeenBuildHash` on build-hash change and `anchorSettings.lastReadingDate` when a daily reading is opened — both via `patchFields`/`useUserProfile`. |
| `insights/{id}` | ❌ No | **Correction:** an earlier version of this doc said this page never reads `insights` — that was wrong. `SobrietyHero` queries the single most recent doc where `type in ['journal', 'workbook']` to source the quote shown in the exported milestone-share image. Read-only, and the field read is just a plaintext `summary` string. |

No direct reads of `journals`, `tasks`, or `workbook_answers` from this page — that part of the original claim holds.

## Gating & limits

None. Every element on this screen is free-tier visible; the tiles are navigation, not the gated features themselves (gating happens on the destination screens, e.g. Journal's custom templates).

## Known gaps / debt

None specific to this screen currently tracked in CLAUDE.md.

## Related docs

- `docs/specs/11_DASHBOARD.md` — existing spec; **thinner than the actual page** (doesn't mention the changelog toast, milestone confetti, or hero color theming). This doc supersedes it for current behavior; the spec still correctly describes the PROJ-76 tile simplification.
- `docs/projects/76_GAMIFICATION_DASHBOARD_RELOCATION.md` — why the tiles lost their stat numbers.
- `docs/projects/41_DYNAMIC_ANCHOR.md` — the time-aware quick action widget.
- `docs/projects/56_HERO_COLOR_THEMES.md` — user-selectable hero accent colors.
- `docs/projects/26_THE_BEACON.md` — push notification opt-in banner.
- **No project doc found** for `SobrietyHero`'s share-to-image / milestone viral loop or its financial-savings tracking — both are real, live, and fairly significant (the share loop is the app's only built-in organic growth mechanism outside the Lisa sponsor-invite flow), but neither turned up a dedicated `docs/projects/` entry when checked. Worth confirming whether one exists under an unexpected name, or whether this was shipped without one.

### Review note (this pass)
A prior version of this doc under-documented `SobrietyHero.tsx` and `DynamicAnchorWidget.tsx` despite listing both as source files — the "How it works" section devoted one line each to genuinely feature-rich components, and the Data model table incorrectly claimed no `insights` read existed. Both are fixed above after re-reading the components directly rather than relying on the earlier pass's summary.
