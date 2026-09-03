# MRT Screen Reference Docs

Purpose-built, LLM-portable markdown — one file per top-level screen in `src/pages/`, written to be read standalone (no other repo context required) and reviewed section by section before being fed into other tools/LLMs.

**Not a replacement for `docs/specs/` or `docs/projects/`.** Those remain the source of truth for ticket history and detailed technical specs. These files are a *consolidated, code-verified* view: for each screen, what it is, how it actually works today, what data it touches, and what's gated — cross-referenced back to the specs/projects that cover it in more depth.

## Format

Each file follows the same shape:

```
# Screen Name — `/route`

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
Anything CLAUDE.md or a governance report already flags as a live gap.

## Related docs
Cross-references into docs/specs/ and docs/projects/.
```

Each doc is verified against the current source, not just transcribed from the existing spec — where the spec and the code disagree, the doc notes it and follows the code.

## Status

| # | Screen | File | Route(s) | Status |
|---|---|---|---|---|
| 1 | Dashboard | `dashboard.md` | `/dashboard` | ✅ Drafted |
| 2 | Journal | `journal.md` | `/journal` | ✅ Drafted |
| 3 | Tasks | `tasks.md` | `/tasks` | ✅ Drafted |
| 4 | Vitality | `vitality.md` | `/vitality` | ⬜ Pending |
| 5 | Workbooks (list) | `workbooks.md` | `/workbooks` | ⬜ Pending |
| 6 | Workbook Detail | `workbook-detail.md` | `/workbooks/:id` | ⬜ Pending |
| 7 | Workbook Session | `workbook-session.md` | `/workbooks/:id/session/:sectionId` | ⬜ Pending |
| 8 | Tools Hub | `tools-hub.md` | `/tools` + 9 tool routes | ⬜ Pending |
| 9 | Urge Surfer | `urge-surfer.md` | `/tools/urge-surfer` | ⬜ Pending |
| 10 | Tool History | `tool-history.md` | `/tools/:toolType/history` | ⬜ Pending |
| 11 | Games Hub | `games-hub.md` | `/games` + 7 game routes | ⬜ Pending |
| 12 | Insights Log | `insights.md` | `/insights` | ⬜ Pending |
| 13 | Recovery Capital (ROSC) | `recovery-capital.md` | `/insights/rosc` | ⬜ Pending |
| 14 | Profile | `profile.md` | `/profile`, `/profile/:tab` | ⬜ Pending |
| 15 | Premium Upgrade | `premium-upgrade.md` | `/premium` | ⬜ Pending |
| 16 | Admin Dashboard | `admin-dashboard.md` | `/admin` | ⬜ Pending |
| 17 | Welcome | `welcome.md` | `/` | ⬜ Pending |
| 18 | Login | `login.md` | `/login` | ⬜ Pending |
| 19 | Links | `links.md` | `/links` | ⬜ Pending |
| 20 | Delete Account | `delete-account.md` | `/delete-account` | ⬜ Pending |
| 21 | Debug Tools | `debug-tools.md` | `/debug` | ⬜ Pending |

Hub pages (Tools Hub, Games Hub) get one consolidated doc covering all their sub-screens, rather than a separate file per tool/game — that keeps this at ~21 files instead of ~40, matching how `src/pages/` is actually organized. Each hub doc still lists every sub-route it owns.

## Source note

Drafted by reading the live page components, related hooks/components, and cross-checking against `docs/specs/`, `docs/SYSTEM_OVERVIEW.md`, and `CLAUDE.md` — corrections are called out inline where the existing spec had drifted from the code.
