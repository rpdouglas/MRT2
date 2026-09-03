# Profile → Achievements — `/profile/achievements`

**Source:** `src/components/profile/AchievementsTab.tsx` + `src/lib/gamification.ts` (XP economy/level curve, unchanged since before PROJ-76) + `src/hooks/useGameProgress.ts`
**Personas:** Ned primarily — he wants streaks/gamification, and PROJ-76 relocated this here specifically so it's opt-in (has to be navigated to) rather than always-visible on David's Dashboard. Walt explicitly wants "zero gamification in his flows" per CLAUDE.md's persona list; this tab exists, but nothing forces him onto it.
**Tier:** Not gated at all — no `PremiumGate`, no tier check, anywhere in this component.
**Zero-knowledge status:** Mostly reads plaintext count/metadata fields (`journals`/`tasks` full docs, `workbook_answers`/`rosc_assessments` via `snap.size` only — no decrypt). The one exception: it pulls `gameHistory` via `useGameProgress()`, which decrypts `game_progress.{encryptedStats,encryptedReflection}` client-side for every record, even though this tab only ever uses `gameHistory.length`. There is also a real correctness gap — not a ZK *violation*, but a data-handling bug — where journal XP math runs against still-encrypted ciphertext instead of decrypted plaintext; see "A real correctness gap" below.

## What it does

Five stat cards — this is where the Dashboard's old bento-tile stat numbers and its Rank/Level/XP display now live exclusively, per PROJ-76 (`docs/projects/76_GAMIFICATION_DASHBOARD_RELOCATION.md`, cross-referenced from `docs/screens/dashboard.md`'s own PROJ-76 note): **Rank & Level** (XP total, level, archetype, progress bar), **Journal Streak**, **Habit Fire** (tasks), **Vitality Rhythm**, **Workbook Wisdom**. The Dashboard's tiles are pure navigation now; none of these numbers appear there anymore.

## How it works

### Data fetched (five independent TanStack Query hooks, all gated `enabled: !!user`)
- **journals** — root `journals`, `where uid==`, `orderBy createdAt desc`, **full docs, no decrypt** (mock-account branch via `getMockJournals` for `*.mock` emails, which *are* plaintext fixtures).
- **tasks** — root `tasks`, `where uid==`, full docs.
- **workbookCount** — `users/{uid}/workbook_answers`, `snap.size` only (a count, not the documents).
- **roscCount** — `users/{uid}/rosc_assessments`, `snap.size` only, `staleTime: 24h`.
- **gameHistory** (via `useGameProgress()`) — root `game_progress`, `where uid==`, `orderBy createdAt desc`; decrypts `encryptedStats` (`JSON.parse`d) and `encryptedReflection` per document.
- **userProfile** (via `useUserProfile()`) — for `sobrietyDate` → `daysClean` (computed once from a `nowMs` captured on mount via `useState(() => Date.now())`, not re-evaluated live).

### XP economy & level curve (`src/lib/gamification.ts`, byte-for-byte reused from the pre-PROJ-76 Dashboard)
`calculateUserLevel(journals, tasks, workbookCount, daysClean, roscCount, xpEligibleGameCount)`:
- **Journal entries** — 25 XP base, +10 "depth bonus" if `content.trim().split(/\s+/).length > 50`; entries tagged `'Vitality'` instead score 15 XP into a separate vitality bucket (skips the depth bonus entirely); entries tagged `'SMART Tool'` (and not `DRAFT_TAG`) score a flat 25 XP into the action bucket.
- **Tasks** — 10/25/50 XP for Low/Medium/High priority, only if completed.
- **Workbook answers** — 15 XP each, flat, from the `workbookCount` number alone (no per-answer inspection).
- **Clean-time milestone** — 500 XP per 30 days clean (`Math.floor(daysClean / 30) * 500`).
- **ROSC assessments** — 25 XP each.
- **Recovery Games** — 20 XP each, **excluding** `gameId === 'daily-crossword'`. Per PROJ-79, the crossword is deliberately reward-free ("the vehicle, not the point"); the filter is applied here in `AchievementsTab` (`xpEligibleGameCount`), not at write time, so `game_progress` keeps one uniform completion-record shape across all 8 games rather than special-casing one game's persistence.
- **Level curve** — `level = max(1, floor(0.07 * sqrt(xp)) + 1)`; titles step at levels 10/20/30/40/50: Seeker → Initiate → Warrior → Architect → Guide → "Elder / Sponsor".
- **Archetype** — whichever of the four XP buckets (wisdom/action/vitality/reflection) is largest: Scholar / Doer / Monk / Philosopher, or "Balanced" if every bucket is exactly 0.
- **The "X / Y XP" readout under the progress bar is cumulative, not per-level.** `levelData.currentXP` is the user's raw career-total XP (not XP earned since the last level-up), and `levelData.nextLevelXP` is the cumulative XP threshold for the *next* level (not the remaining gap). The bar's fill-percent *is* correctly computed as progress-within-the-current-level, but the two numbers printed beside it are both whole-career totals — easy to misread, and increasingly misleading at higher levels since the sqrt curve makes the real gap between levels grow quickly.

### Per-card stats (`calculateJournalStats`/`calculateTaskStats`/`calculateVitalityStats`/`calculateWorkbookStats`)
- **Journal Streak** — `journalStreak` (consecutive-day streak counting from today or yesterday, breaks on any gap) and `consistencyRate` (total entries ÷ weeks-active-since-first-entry, one decimal).
- **Habit Fire** — `habitFire` (sum of every task's `currentStreak` field, uncapped) and `completionRate` (% of all-time tasks ever marked completed — not a rolling window).
- **Vitality Rhythm** — `bioStreak`/`totalLogs`, computed from the same consecutive-streak helper but filtered first to journals tagged `'Vitality'` only.
- **Workbook Wisdom** — `wisdomScore` (= `workbookCount`) and `masterCompletion` (% of `TOTAL_WORKBOOK_QUESTIONS`, a module-level constant summed once across every non-`read_only` question in every workbook in `src/data/workbooks.ts`, so it recalculates automatically as workbook content changes rather than relying on a hardcoded denominator).

### A real correctness gap: journal XP/word-count logic runs on ciphertext, not plaintext
The journal `useQuery` above returns raw Firestore document data with **no decrypt call** — `content` stays as its stored `IV:Ciphertext` base64 string, which per CLAUDE.md's ZK table is what `journals.content` actually is for every real (non-`.mock`) account. Both `calculateUserLevel`'s "long entry" +10 XP depth bonus and `calculateJournalStats`'s `totalWords` (computed but never rendered by this tab) test `content.trim().split(/\s+/).length` — and base64 ciphertext contains no whitespace, so that split always yields length 1 for a genuinely encrypted entry. **The depth-bonus XP effectively never fires for any real user's journal entries** — it only ever applies to `.mock`-email demo accounts, whose `getMockJournals` fixtures are plaintext. This silently under-counts total XP (and therefore level) by 10 per long journal entry, with no error, warning, or visible symptom anywhere — it just reads as "a bit less XP than expected." This logic predates PROJ-76 (that project's own spec says `gamification.ts` was "untouched... just called from a different component" when it moved off the Dashboard), so it isn't a relocation regression, but it doesn't appear to be documented anywhere else either.

### Vault-unlock independence
Unlike the Data tab's manual export (which wraps its buttons in its own `<VaultGate>` because Profile's routes aren't `VaultGate`-wrapped at the `App.tsx` level — see `data.md`/`security.md`), this tab has **no vault-unlocked check anywhere**, despite `useGameProgress()` calling `decrypt()` on every `game_progress` document. If the vault happens to be locked when this tab loads, those per-game decrypts most likely fail — `useGameProgress`'s own `try/catch` swallows a decrypt failure into `stats = {}` / `reflection = '[Error Decrypting]'` rather than throwing — but since `AchievementsTab` never renders `stats` or `reflection`, only `gameHistory.length`, the failure is invisible either way. Worth knowing if this tab (or a future one reusing `useGameProgress()`) ever surfaces per-game stats/reflection text directly.

## Data model

This tab is entirely read-only — it writes nothing. What it reads:

| Source | Query shape | Encrypted? | Feeds |
|---|---|---|---|
| `journals` (root, `uid==`) | Full docs, `orderBy createdAt desc` | `content` is ciphertext and is **not** decrypted here (see gap above); `tags`/`moodScore`/`createdAt` are plaintext | Journal Streak card; XP reflection/vitality/SMART-tool buckets |
| `tasks` (root, `uid==`) | Full docs | Plaintext per CLAUDE.md | Habit Fire card; XP action bucket |
| `users/{uid}/workbook_answers` | `snap.size` only | Encrypted, but not fetched — count only | Workbook Wisdom card; XP wisdom bucket |
| `users/{uid}/rosc_assessments` | `snap.size` only, 24h `staleTime` | Partial, but not fetched — count only | XP only; no dedicated card |
| `game_progress` (root, `uid==`, via `useGameProgress()`) | Full docs, decrypted | `encryptedStats`/`encryptedReflection` decrypted client-side; `gameId`/`score` plaintext | XP action bucket (`daily-crossword` excluded); decrypted content itself never displayed |
| `users/{uid}.sobrietyDate` (via `useUserProfile()`) | Single doc | Plaintext | `daysClean` → clean-time XP milestones |

## Gating & limits

None. No `PremiumGate`, no tier check, no rate limit anywhere in this component — fully free, for every tier, unlimited.

## Known gaps / debt

- Journal "depth bonus" XP (and the unused `totalWords` stat) is computed against encrypted ciphertext instead of decrypted plaintext, so it never actually fires for a real account — see "A real correctness gap" above. Pre-existing, carried over unchanged from the pre-PROJ-76 Dashboard implementation.
- The "X / Y XP" progress readout shows two career-cumulative totals, not "XP earned this level" / "XP needed to finish this level," even though the bar's fill-percent above it *is* computed correctly per-level — a mismatch between what the numbers say and what the bar shows.
- `useGameProgress()`'s decrypt calls run unconditionally on every load of this tab even though `stats`/`reflection` are never displayed here — wasted decrypt work each time, and a silent failure mode if the vault happens to be locked (see "Vault-unlock independence" above).
- `habitFire` sums every task's `currentStreak` with no cap and no decay logic visible in this tab — whether stale/no-longer-active recurring tasks' streaks reset or decay is owned by task-completion logic elsewhere (see `docs/screens/tasks/README.md`), not verified as part of this review.

## Related docs

- `docs/screens/profile/README.md` — parent index; the "relocated from Dashboard" framing.
- `docs/screens/dashboard.md` — PROJ-76 note describing exactly what this tab replaced and why.
- `docs/projects/76_GAMIFICATION_DASHBOARD_RELOCATION.md` — the relocation itself; confirms `gamification.ts` logic is unchanged.
- `docs/projects/79_DAILY_CROSSWORD.md` — why `daily-crossword` completions are excluded from XP here.
- CLAUDE.md — Zero-Knowledge Encryption Boundary (`journals`/`workbook_answers`/`rosc_assessments`/`game_progress` encryption status referenced throughout).
