# Journal → Insights — `/journal?tab=insights`

**Source:** `src/components/journal/JournalInsights.tsx` + `ManageWordCloudModal.tsx`
**Personas:** Walt (analytical, traceable charts), Maya (pattern tracking) — explicitly a "zero gamification" surface per the Walt persona note in CLAUDE.md.
**Tier:** Free. All charts here use only the plaintext fields already on `journals/{id}`.
**Zero-knowledge status:** Reads `journals` (`where uid, orderBy createdAt asc`) but only touches plaintext fields (`moodScore`, `weather`, `createdAt`, `sentiment`) for the charts — **and** decrypts `content` client-side for the word cloud, since word frequency requires the actual text.

## What it does

Chart-based visualizations of journaling patterns over time — mood trend, day-of-week comparison, and a word-frequency cloud — with no AI involved (charts are pure client-side aggregation of the user's own data).

## How it works

- **Mood/weather trend** — `AreaChart`/`ComposedChart` (Recharts) over `DailyStats` computed client-side from the raw plaintext fields (`moodScore`, `weather.temp`, entry count per day).
- **Weekly rhythm comparison** — current week vs. a prior window, per day-of-week (`WeeklyComparisonStats`), similar in spirit to Tasks' Rhythm Score but computed independently here.
- **Word Cloud** — the one place on this tab that needs decrypted content. Tokenizes decrypted entry text, strips a large built-in stop-word list (`RECOVERY_STOP_WORDS` — includes both generic English stop words and MRT-specific boilerplate like "check-in", "meeting", "sober", "grateful") plus a user-managed blocklist stored in `localStorage` (`mrt_word_cloud_ignore_list`, not synced to Firestore — per-device only). `ManageWordCloudModal` lets the user add/remove blocklist words.

## Data model

| Collection | Encrypted? | What this screen touches |
|---|---|---|
| `journals/{id}` | ✅ Content yes | Charts use plaintext `moodScore`/`weather`/`createdAt`/`sentiment` only; the word cloud additionally decrypts `content` client-side. |

No Firestore writes originate from this tab — it's read-only visualization.

## Gating & limits

None. Free for all tiers.

## Known gaps / debt

None currently flagged in CLAUDE.md for this screen.

## Related docs

- `docs/screens/journal/README.md` — parent index.
- `docs/screens/journal/analysis-wizard.md` — the AI-driven pattern analysis is a **separate** flow launched from the History tab, not from here, despite the natural expectation that "Insights" would be where AI analysis lives.
- `docs/specs/01_JOURNAL.md` §2C ("Insights — The Dashboard").
