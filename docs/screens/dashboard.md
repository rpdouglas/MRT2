# Dashboard — `/dashboard`

**Source:** `src/pages/Dashboard.tsx` + `SobrietyHero.tsx`, `DynamicAnchorWidget.tsx`, `BentoCard.tsx`, `NotificationBanner.tsx`, `VibrantHeader.tsx`, `useUserProfile.ts`, `lib/milestones.ts`, `lib/heroColors.ts`, `lib/versioning.ts`
**Personas:** All — this is the app's home screen and first thing every user sees after unlocking the vault.
**Tier:** Free. No premium gating on this screen itself.
**Zero-knowledge status:** Reads only `users/{uid}` (unencrypted profile metadata — see table below). Does **not** query `journals`, `tasks`, or `workbook_answers` directly (see PROJ-76 note below) — nothing here requires the vault to be unlocked to *render* the shell, though `SobrietyHero` needs `userProfile.sobrietyDate`.

## What it does

The landing hub after login/unlock. Shows sobriety duration (with milestone celebration), a time-aware "what should I do right now" quick-action widget, a backup reminder, an update notification, and a 2×6 grid of entry tiles into the app's six main modules (Journal, Tasks, Vitality, Workbooks, Games, Tools).

It is deliberately *not* a stats dashboard anymore — see the PROJ-76 history below.

## How it works

Layout is three fixed/scroll regions stacked in a flex column (`h-[100dvh]`):

1. **Fixed header** — `VibrantHeader` with a randomly-selected slogan from `src/data/slogans.ts` (re-rolled once per mount, not per visit in any tracked sense), themed via `getHeroColorTheme(userProfile.heroColor)` (PROJ-56 hero color themes — user-selectable accent palette).
2. **Floating hero** — `SobrietyHero`, given `userProfile.sobrietyDate` and the full profile. Computes `daysClean` locally (`Math.ceil` on ms diff from `sobrietyDate` to now, evaluated once via a `useState` initializer to satisfy hook purity rules — not re-evaluated on a timer).
3. **Scrollable body**, top to bottom:
   - `NotificationBanner` — push notification opt-in (PROJ-26).
   - **Changelog toast** — inline banner (not a component), shown when `userProfile.lastSeenBuildHash` differs from the current build's hash (`useBuildInfo()`). First-ever load just silently records the hash; a hash *change* triggers the toast and links out to the published changelog (`https://rpdouglas.github.io/MRT2/support/changelog`). Dismiss just hides the toast for that session (the hash was already persisted).
   - **Backup alert** — amber banner shown when `!driveAccessToken` (no live Google Drive session) AND (`lastExportAt` is unset OR older than 7 days). Links to `/profile`.
   - `DynamicAnchorWidget` — time-of-day-aware quick action bar (Morning/Afternoon/Evening/Night; PROJ-41).
   - **6-tile bento grid** — `BentoCard` × 6, statically defined in `BENTO_TILES` at module scope: Journal, Tasks, Vitality, Workbooks, Games, Tools. Each tile is just an icon + title + one-line caption + `Link` — no live stat numbers.
4. **Milestone confetti** — a `useEffect` keyed on `daysClean` checks `getMilestone(daysClean)`; if it's a milestone day, fires `react-confetti` for ~10s (unless `prefers-reduced-motion` is set — PROJ-98 Phase 2 explicitly skips the animation for those users, since the medallion/banner in `SobrietyHero` itself is the actual reward signal). Guarded by a `sessionStorage` flag (`mrt_milestone_{n}_played`) so it fires once per session per milestone, not once per render.

### PROJ-76: tiles used to show live stats

Until PROJ-76, all six bento tiles carried live numbers (Journal streak, Habit Fire, Vitality Rhythm, Workbook Wisdom) and the Dashboard queried `journals`/`tasks`/`workbook_answers` to compute them. That was relocated to Profile → Achievements to cut cognitive load; the Dashboard's job narrowed to pure navigation + the sobriety hero + the anchor widget. If you're reading an older mental model of this screen (or an LLM trained on an earlier version of this repo) that describes stat numbers on the tiles, that's stale — the current code has none.

## Data model

| Collection | Encrypted? | What this screen reads/writes |
|---|---|---|
| `users/{uid}` | ❌ No | Reads `sobrietyDate`, `heroColor`, `lastExportAt`, `lastSeenBuildHash`. Writes `lastSeenBuildHash` via `patchFields` mutation (from `useUserProfile`) on build-hash change. |

Nothing else — no direct reads of `journals`, `tasks`, `workbook_answers`, or `insights` from this page.

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
