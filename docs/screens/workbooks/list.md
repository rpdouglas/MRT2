# Workbooks → List — `/workbooks`

**Source:** `src/pages/Workbooks.tsx` + `src/hooks/useWorkbookLibrary.ts`
**Personas:** Maya (systematic completion — this is her library view), Walt (browses toward Recovery Dharma), Lisa (Fellowships tab as a quick-reference directory for sponsees). No persona-specific branching in the code — same screen for everyone.
**Tier:** Free, unrestricted. No `<PremiumGate>`, no rate limit, no Gemini call anywhere on this screen.
**Zero-knowledge status:** Touches no encrypted collection. Its only write is `users/{uid}.installedWorkbookIds` (plaintext array of workbook IDs) via `useUserProfile()`'s existing profile mutation — no new Firestore collection or rule per `docs/projects/75_WORKBOOK_MARKETPLACE.md`.

## What it does

The entry point into the Workbooks feature: a three-tab hub for browsing installed workbooks, managing which of the four official workbooks are in the user's library, and finding outbound links to fellowship websites/literature. Tab state is local `useState` (`'workbooks' | 'marketplace' | 'literature'`), not a URL param — switching tabs doesn't survive a refresh or deep-link, unlike Journal's `?tab=` pattern.

## How it works

### Workbooks tab (default)
Renders `installedWorkbooks` (from `useWorkbookLibrary()`) as a list of cards, each linking to `/workbooks/{workbook.id}`. Each card shows the title, description (2-line clamp), a `{sections.length} Sections` badge, and — only for `type === 'steps'` workbooks — a "12-Step Compatible" badge. (This badge fires for both `12_steps` and `recovery_dharma`, since both share `type: 'steps'` in the data model; it isn't literally 12-step-specific despite the label.) Card left-border color and icon come from a local `getTheme(type)` switch: `general` → yellow/star, `steps` → blue/book, anything else (`specialty`) → purple/heart. An empty-library state ("Your library is empty… Visit the Marketplace tab") shows if `installedWorkbooks.length === 0` — reachable only if a user removes all four workbooks, since every account starts with all of them installed.

### Marketplace tab
Lists the full `catalog` (all four `WORKBOOKS`, always — this is not a filtered "not yet installed" view) with an Add/Remove toggle button per card, driven by `isInstalled(workbook.id)`. Installed cards additionally show an "In My Workbooks" pill. Buttons call `addWorkbook`/`removeWorkbook` from `useWorkbookLibrary()`, both disabled while `isUpdating` (the shared `updateProfile.isPending` flag — an in-flight toggle on one card disables every other card's button too, since there's no per-card pending state). A caption explains the non-destructive semantics: "Removing a workbook only hides it here — your saved answers are kept and restored if you add it back" — confirmed by the code: `removeWorkbook` only edits `installedWorkbookIds`, it never touches `workbook_answers`.

There is no actual marketplace mechanism here (no search, no pricing, no third-party/community content, no server-fetched catalog) — "Marketplace" is UI framing over a static enable/disable toggle against the same four hardcoded workbooks the Workbooks tab reads from.

### Fellowships tab
A pure static directory, `FELLOWSHIP_RESOURCES` — a 5-entry array literal defined at the top of `Workbooks.tsx` itself (not in `src/data/`): Alcoholics Anonymous, Narcotics Anonymous, SMART Recovery, Recovery Dharma, Women for Sobriety. Each renders two outbound links ("Official Website" and "Core Literature"), both `target="_blank" rel="noopener noreferrer"`, both plain hardcoded URLs — no click tracking, no in-app browser, no affiliate/referral parameters.

## Data model

| Field | Location | Encrypted? | Notes |
|---|---|---|---|
| `installedWorkbookIds` | `users/{uid}` | ❌ Plaintext | `string[]` of workbook IDs; read/written via `useUserProfile()`. Defaults to all four IDs (`getDefaultInstalledWorkbookIds()`) for any profile that predates this field. |

Workbook content itself (`WORKBOOKS`, `FELLOWSHIP_RESOURCES`) is static, bundled TypeScript — not a Firestore read on this screen at all.

## Gating & limits

None. Every tab, every action (browse, add, remove, open a fellowship link) is unrestricted for any authenticated user.

## Known gaps / debt

- No per-card pending state on the Marketplace tab — `isUpdating` is one shared flag from `useWorkbookLibrary()`, so tapping Add on one workbook visibly disables every other card's button until that single write resolves. Minor UX rough edge, not a correctness bug.
- "Marketplace" as a label may over-promise relative to what's actually there (a static 4-item catalog toggle) — worth knowing if extending this tab, since the existing UI copy and spec (`docs/projects/75_WORKBOOK_MARKETPLACE.md`) already frame it this way deliberately, not as an oversight.

## Related docs

- `docs/screens/workbooks/README.md` — parent index, full workbook content-model table.
- `docs/screens/workbooks/detail.md` — where a card's `Link` lands.
- `docs/specs/04_WORKBOOKS.md` §2 ("The Workbooks Hub").
- `docs/projects/75_WORKBOOK_MARKETPLACE.md` — install/library mechanism spec.
