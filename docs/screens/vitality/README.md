# Vitality — `/vitality`

**Parent page:** `src/pages/Vitality.tsx` — a thin shell that renders one of three tabs (`move` default, `fuel`, `breath`) based on local component `useState`, **not** a URL param. Unlike Journal's `?tab=` pattern, switching tabs here has no deep link, doesn't survive a refresh, and — because each tab is conditionally rendered (`{activeTab === 'move' && <MoveTab .../>}`) rather than kept mounted and hidden — the inactive tabs fully unmount. Any in-progress, unsaved form state (Move's activity/duration fields, Fuel's hydration tap counter) is lost the moment the user switches tabs.

Vitality is a **virtual module**: it has no dedicated Firestore collection of its own. All three tabs write into the same `journals/{id}` collection Journal uses, distinguished only by a tag signature (`Vitality` + a category tag). This is a deliberate architecture choice per `docs/specs/06_VITALITY.md`, not an oversight — see each tab doc's Data model section.

This screen has enough distinct sub-experiences (two short form loggers and a full breathwork timer engine) to warrant its own folder — each file below is independently readable.

| Sub-screen | File | Component(s) |
|---|---|---|
| Move | [`move.md`](./move.md) | `MoveTab.tsx` |
| Fuel | [`fuel.md`](./fuel.md) | `FuelTab.tsx` |
| Breath | [`breath.md`](./breath.md) | `BreathTab.tsx`, `useBreathEngine.ts`, `useWakeLock.ts` |

**Shared data layer (all three tabs):** `useVitalityEntries()` (`src/hooks/useVitalityEntries.ts`) is the single write path — it builds the entry's plaintext content, infers a mood score, encrypts, and calls `useJournalOperations().addJournal()`. It also composes `useTodaysVitalityLogs()` (`src/hooks/useTodaysVitalityLogs.ts`, a dedicated real-time `onSnapshot` listener — not the shared `['journals', uid]` TanStack Query cache) with `calculateBioBalance()` (`src/lib/vitalityScoring.ts`) to drive the Bio-Balance ring shown in the page header (`VibrantHeader`'s `percentage` prop). The ring is **not** a persisted field — it's recomputed live from today's tag-filtered logs every render: +33.3% each if today has a log tagged `Movement`, `Nutrition`, and (`Mindfulness` or `Meditation`), capped at 100.

**Personas:** Not restricted to any one persona — a general self-regulation/self-care surface. Explicitly named in `docs/PERSONAS.md` for **Lisa** (sponsor persona): the Vitality module is called out as her personal self-care counterbalance to service work, and its prompts are the designed response to her "Burnout" worst-case (§ Lisa persona). `docs/PERSONAS.md` §2's "Day 1+ Parallel MAT Track" row also calls for "discrete medication compliance logs and craving-correlation indicators" to surface in Vitality when MAT mode is enabled (for **Jordan**) — **this is not implemented in the current code**: none of `MoveTab.tsx`/`FuelTab.tsx`/`BreathTab.tsx` has any MAT-mode branching, dose field, or medication log. Treat that persona-doc line as an aspirational/undelivered commitment, not a description of shipped behavior. Breath's "Somatic Anchor" is thematically grounding-exercise-adjacent (relevant to David in a regulation sense) but it is **not** one of the crisis-floor features CLAUDE.md names as never-gateable (SOS, Urge Surfer, Craving Buster, sponsor/hotline contact, the sobriety counter) — don't conflate the two.

**Tier:** Free, unrestricted, across all three tabs. No `<PremiumGate>`, no `useRateLimits` call, and no Gemini call anywhere in `Vitality.tsx`, the three tab components, or `useVitalityEntries.ts`/`useBreathEngine.ts` — Vitality is entirely local computation plus an encrypted Firestore write; it never touches the AI-analysis boundary at all.

**Zero-knowledge status:** All three tabs write to `journals/{id}` (per CLAUDE.md's table: `content` AES-GCM encrypted, `moodScore`/`tags`/timestamps plaintext). `useVitalityEntries.saveVitalityEntry()` calls `encrypt()` (`src/lib/crypto.ts`, module-level `globalKey` set elsewhere by the vault-unlock flow) on the assembled plaintext before it ever reaches `addJournal()`. If the vault is locked (`globalKey` unset), `encrypt()` throws and the write is aborted — but unlike `JournalEditor.tsx`'s specific "Security Error: Could not encrypt. Save aborted." alert, Vitality's catch block wraps both the `encrypt()` call and the Firestore write together and shows one generic `alert("Failed to save entry.")` for either failure, so a user can't tell from the error message whether it was an encryption problem or a network/write problem.

## Related docs

- `docs/specs/06_VITALITY.md` — existing spec; broadly accurate on the virtual-module architecture, tag signatures, and breathwork mechanics (mutable-ref timer, haptics, wake lock, organic-halo visuals) — confirmed against code. Its "Smart Mood Integration" description matches `inferMoodFromRecentEntries()` exactly. See each tab doc for specific drift notes.
- `docs/screens/journal/README.md` — the `journals/{id}` collection Vitality writes into; `useJournalOperations.ts` is shared between both screens.
- `docs/PERSONAS.md` — Lisa's self-care counterbalance framing; the undelivered MAT-mode commitment for Jordan.
