# MRT Screen Reference Docs

Purpose-built, LLM-portable markdown — one file per navigable screen **and sub-screen** (tab, individual tool, individual game) in the app, written to be read standalone (no other repo context required) and reviewed section by section before being fed into other tools/LLMs.

**Not a replacement for `docs/specs/` or `docs/projects/`.** Those remain the source of truth for ticket history and detailed technical specs. These files are a *consolidated, code-verified* view: for each screen, what it is, how it actually works today, what data it touches, and what's gated — cross-referenced back to the specs/projects that cover it in more depth.

Deliberately fine-grained: a multi-tab or multi-item page (Journal, Tasks, Vitality, Tools Hub, Games Hub, Insights, Profile, Admin) gets one file per tab/tool/game rather than one file for the whole page, so each doc stays short enough to review on its own.

## Format

Each file follows the same shape:

```
# [Feature] → [Screen] — `/route`

**Source:** src/pages/X.tsx (+ key components/hooks)
**Personas:** who it's for
**Tier:** Free / Premium-gated specifics
**Zero-knowledge status:** collections touched, encrypted or not

## What it does
Plain-language summary.

## How it works
Data flow, state, key components/hooks, notable logic.

## Data model
Table: collection | encrypted? | notes

## Gating & limits
Premium gates, rate limits, or "none — explicitly free per crisis-first floor."

## Known gaps / debt
Anything CLAUDE.md or a governance report already flags as a live gap, plus anything newly found while writing this doc.

## Related docs
Cross-references into docs/specs/, docs/projects/, and sibling docs/screens/ files.
```

Every doc was verified against the current source, not just transcribed from the existing spec — where the spec and the code disagree, the doc notes it and follows the code as ground truth.

## Structure

| Feature | Folder/file | Screens covered |
|---|---|---|
| Dashboard | `dashboard.md` | Single screen, `/dashboard` |
| Journal | `journal/` | Write, History, Insights, Analysis Wizard (4 files + README) |
| Tasks | `tasks/` | Today, Later, Log (3 files + README) |
| Vitality | `vitality/` | Move, Fuel, Breath (3 files + README) |
| Workbooks | `workbooks/` | List, Detail, Session (3 files + README) |
| Tools | `tools/` | Hub, History, Urge Surfer + 9 CBT/DBT tools (11 files + README) |
| Games | `games/` | Hub + 8 individual games (9 files + README) |
| Insights | `insights/` | Log, ROSC Snapshot/Trends/History (4 files + README) |
| Profile | `profile/` | General, Security, Data, Achievements (4 files + README) |
| Admin | `admin/` | Analytics, Users, Health, Feedback, Maintenance (5 files + README) |
| Welcome | `welcome.md` | Single screen, `/` |
| Login | `login.md` | Single screen, `/login` |
| Links | `links.md` | Single screen, `/links` |
| Delete Account | `delete-account.md` | Single screen, `/delete-account` |
| Premium Upgrade | `premium-upgrade.md` | Single screen, `/premium` |
| Debug Tools | `debug-tools.md` | Single screen, `/debug` |

62 files total. Every route in `src/App.tsx` is covered.

## Notable findings surfaced while writing these docs

Writing these required reading every screen's actual save/gating/access-control logic line by line, which turned up several things worth a follow-up look — none fixed here, since that's outside the scope of a documentation pass, but flagged in the relevant file so they don't get lost:

- **`DeleteAccount`'s "cryptographic shredding" is incomplete.** `executeTotalAccountAnnihilation()` never purges `service/{id}` (sponsee notes) or `users/{uid}/rosc_assessments` — both real, at-least-partially-encrypted user data — despite the page's own copy claiming full deletion. See `delete-account.md` and `profile/data.md`.
- **`rosc_assessments` is a subcollection, not top-level.** It actually lives at `users/{uid}/rosc_assessments/{id}`; CLAUDE.md's schema table lists it as if it were a root collection. See `insights/recovery-capital-history.md`.
- **CLAUDE.md's Workbook AI rate-limit gap is partially stale.** It says `analyzeWorkbookContent`/`getGeminiCoaching` have "no tier check and no rate limit at all" — PROJ-106 already shipped server-side cooldowns for both. What's still true: neither is tier-differentiated (free and premium get identical access) and neither has client-side rate-limit UX. See `workbooks/detail.md` and `workbooks/session.md`.
- **A similar, previously undocumented gap exists on two more Gemini flows.** `generateCBTCoachingPrompt` (Guided Workflow Engine) and `generateCBAReflection` (CBA Tool) are premium-gated client-side only — the server-side proxy has no tier check or rate limit for either. Not in CLAUDE.md's current "known live gap" list. See `tools/README.md` and `tools/cba.md`.
- **Thought Challenge is dual-registered and effectively live despite `active: false`.** That flag only hides its tile on the Games Hub — the game itself, and a second entry point via the Tools Hub registry, both still work. Undocumented anywhere else in the repo. See `games/thought-challenge.md`.
- **A real, silent correctness bug in XP calculation.** `AchievementsTab`'s "+10 depth bonus" for journal entries over 50 words runs a word-count check against `content` that's never decrypted there — for real accounts (AES-GCM ciphertext) the check always returns a length of 1, so the bonus silently never fires outside `.mock` demo accounts. See `profile/achievements.md`.
- **Reset Vault has weaker confirmation than Account Deletion.** Reset Vault only requires typing "RESET," with no PIN re-entry; Delete Account forces re-authentication. See `profile/security.md`.
- **Two admin specs overstate what `FriendsDirectory` and the Maintenance tools do.** Both `03_ADMIN.md` and `08_ADMIN.md` describe the Users tab as paginated/searchable and the Maintenance tools as generic — the actual code has neither pagination nor search, and the maintenance tools only ever operate on the logged-in admin's own account. See `admin/users.md` and `admin/maintenance.md`.
- **`DebugTools` (`/debug`) is gated client-side only**, via an in-component `isAdmin` check, not a route-level guard — live in production for any admin account, with no confirmation dialogs on its write actions. See `debug-tools.md`.
- **Journal's Analysis Wizard is triggered from History, not Insights** — a naming mismatch worth knowing if you're looking for it. See `journal/README.md`.

## Source note

Drafted by reading the live page/component/hook source directly and cross-checking against `docs/specs/`, `docs/SYSTEM_OVERVIEW.md`, and `CLAUDE.md` — corrections are called out inline where the existing spec had drifted from the code, and flagged here at the index level when they're significant enough to be worth a second look.
