# Admin → Maintenance — `/admin` (tab: maintenance)

**Source:** `src/pages/AdminDashboard.tsx` (tab guard + `uid` prop-drilling) + `src/components/admin/DeduplicationTool.tsx`, `src/components/admin/SchemaMigration.tsx`
**Personas:** Not a real per-persona surface — closer to Dev/Alex self-service tooling than a general admin capability (see "How it works" — these tools only ever touch the *operating admin's own* data, never another user's).
**Tier:** N/A — not tier-gated; admin-only (see `docs/screens/admin/README.md`).
**Zero-knowledge status:** `DeduplicationTool` reads `journals.content` — still AES-GCM ciphertext per CLAUDE.md's collection table — but never decrypts it: its dedup key is `${content.trim()}_${time}`, comparing the raw stored ciphertext string (which embeds the IV, per CLAUDE.md's `IV:Ciphertext` storage format) directly. Two entries collide only if their ciphertext is byte-identical, i.e. this only catches literal duplicate writes (same plaintext *and* same IV — realistically only a re-run import writing the exact same encrypted blob twice), not semantically-similar different plaintexts, and no decryption key is ever needed or used. `SchemaMigration` touches only `insights`, unencrypted per CLAUDE.md's table.

## What it does

Two independent, single-button data-repair utilities rendered side by side (`grid grid-cols-1 md:grid-cols-2`): a **Journal Deduplicator** (deletes journal entries with byte-identical `content` + timestamp — an artifact of a known import bug) and a **Schema Migration** tool (backfills a legacy `insights` field name to the current one). **Both operate exclusively on the currently-logged-in admin's own account** — there is no UI to target another user's uid.

## How it works

### The tab-visibility guard
`AdminDashboard.tsx` renders this tab as `activeTab === 'maintenance' && user && (...)`. `user` here is the `useAuth()` Firebase Auth `User` object — not `isAdmin` (already checked earlier in the same component, which returns `<Navigate to="/dashboard" />` before this JSX is ever reached if `isAdmin` is false). The extra `&& user` check exists because both child components require a non-optional `uid: string` prop (`<DeduplicationTool uid={user.uid} />`) — without the guard, a still-null `user` during the brief window before Firebase auth state resolves would throw on `user.uid`. In practice, since `isAdmin` only ever becomes `true` once a user profile has loaded (see `AuthContext.tsx`), `user` is non-null by the time this tab is reachable at all — so this reads as a defensive, TypeScript-satisfying guard rather than one that meaningfully gates real traffic.

### Journal Deduplicator (`DeduplicationTool.tsx`)
1. `window.confirm("This will permanently delete duplicate journal entries. Continue?")`.
2. `query(collection(db, 'journals'), where('uid', '==', uid))` — `uid` is the **admin's own** uid, passed down as a prop; `getDocs`.
3. Builds a `Map<string, string>` keyed by `${content.trim()}_${time}` where `content` is the raw (still-encrypted) `content` field string and `time` is `createdAt?.toMillis?.()` with a defensive fallback for a plain JS `Date`. Any doc whose key was already seen is queued as a duplicate.
4. Batched deletes via `writeBatch`, chunked at **400 ops per batch** (below Firestore's 500-op limit), committing and starting a fresh batch each time the counter hits 400.
5. Status messages update throughout ("Scanning...", "Found N duplicates...", "Success! Removed N...").

### Schema Migration (`SchemaMigration.tsx`)
1. **No confirmation dialog** (unlike the Deduplicator).
2. `query(collection(db, 'insights'), where('uid', '==', uid))` — again the admin's own uid; `getDocs`.
3. For each doc with a legacy `actionableSteps` field present and `suggested_actions` absent: `batch.update(docSnap.ref, { suggested_actions: data.actionableSteps, migratedAt: new Date() })`.
4. A **single** `batch.commit()` at the end — **no chunking** (unlike the Deduplicator's 400-op batching), so a migration touching more than 500 `insights` docs in one run would fail outright against Firestore's per-batch write cap.
5. `migratedAt` is stamped with a client-side `new Date()`, not `serverTimestamp()` — inconsistent with CLAUDE.md's "JS `Date` for UI/logic, Firestore `Timestamp` for storage" rule.

## Data model

| Collection | Fields touched | Access pattern |
|---|---|---|
| `journals/{id}` | `uid` (query filter), `content` (read + compared as ciphertext, never written), `createdAt` (read) | Read + delete only, scoped to the admin's own `uid`. |
| `insights/{id}` | `uid` (query filter), `actionableSteps` (read, legacy), `suggested_actions` (written), `migratedAt` (written, client `Date`) | Read + update only, scoped to the admin's own `uid`. |

Both queries rely on ordinary owner-scoped `firestore.rules` (`isResourceOwner()`/`isCreatingOwnedResource()`-style rules on `journals`/`insights`) — neither tool needs or invokes the `isAdmin()` database rule, since every read/write here is on the operating admin's own documents. The page-level `isAdmin` UI gate (see README) is what puts an admin here at all; the Firestore rules underneath don't distinguish this from a normal user editing their own data.

## Gating & limits

Page-level admin gate only. No ability to select a target uid (hardcoded to the operating admin's own account via the `uid` prop from `AdminDashboard.tsx`), so there is no rate limit or confirmation beyond what's described above — one `window.confirm` for Dedup, none for Schema Migration.

## Known gaps / debt

- **Self-uid-only scoping is undocumented in both specs.** `03_ADMIN.md` §2D and `08_ADMIN.md` §2D both describe these as generic "Maintenance Tools" ("Deduplicator: Scans for duplicate journal entries... Schema Migration: Updates legacy documents...") with no mention that they only ever run against the *admin's own* account — an admin cannot use this tab to fix another user's (e.g. one of Lisa's sponsees') stuck data. Flag as spec/code drift; code is ground truth, matching the README's index note ("admin's own account only").
- **Schema Migration has no batch-chunking**, unlike Deduplicator's 400-op chunks — a large migration run risks an outright Firestore batch-limit failure with no partial-progress handling.
- **Schema Migration has no confirmation dialog** before committing writes, asymmetric with the Deduplicator.
- **`migratedAt: new Date()`** (client clock) instead of `serverTimestamp()` — clock-skew risk, and inconsistent with the rest of the codebase's Timestamp discipline per CLAUDE.md.
- No dry-run/preview for either tool — both commit their destructive/mutating operation directly from the single button, with only a textual status readout after the fact.
- The Deduplicator's ciphertext-equality dedup key means it cannot catch near-duplicate entries with different IVs (i.e. the same plaintext re-encrypted) — only literal repeat writes of the identical encrypted blob.

## Related docs

- `docs/screens/admin/README.md` — parent index; the source for this file's "admin's own account only" framing (its collection table already flags this).
- `docs/specs/08_ADMIN.md` §2D ("Maintenance Tools") — current spec, generic description (see drift note above).
- `docs/specs/03_ADMIN.md` §2D ("Maintenance Tools") — superseded, same generic description.
