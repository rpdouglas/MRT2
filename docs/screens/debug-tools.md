# Debug Tools — `/debug`

**Source:** `src/pages/DebugTools.tsx`
**Personas:** None — an internal developer/QA diagnostic tool, not a user-facing feature for any of the six product personas.
**Tier:** N/A — access is gated on `isAdmin` (role-based), not `tier` (billing-based). Not premium-gated; not free-tier-limited.
**Zero-knowledge status:** Reads and writes `tasks/{id}` directly (plaintext collection per CLAUDE.md — `tasks` is `❌ No` encryption). No encrypted content is touched.

## What it does

A "Time Travel Debugger" — a diagnostic page for manually manipulating a task's `status`/`lastCompletedAt`/`dueDate`/`currentStreak` fields to simulate the passage of time, so a developer can verify the Tasks module's streak-reset and "missed day" logic without waiting for real days to pass. Lists the signed-in user's own tasks and offers two one-click simulation buttons per task.

## How it works

- On mount (and on manual refresh), `loadTasks()` queries `tasks` where `uid == user.uid` and loads them into local state — **but only if `isAdmin` is true**; the query is skipped entirely otherwise (`if (!user || !db || !isAdmin) return;`).
- **`simulateCompletedYesterday(taskId)`** — `updateDoc`s the task to `{ status: 'completed', lastCompletedAt: <yesterday>, dueDate: <yesterday>, currentStreak: 5 }`, to let the developer navigate to the real Tasks page and verify the streak-reset behavior fires correctly for a task completed the prior day.
- **`simulateMissedYesterday(taskId)`** — `updateDoc`s the task to `{ status: 'pending', lastCompletedAt: <two days ago>, dueDate: <yesterday>, currentStreak: 5 }`, to verify the "missed day" streak-punishment path.
- Both hardcode `currentStreak: 5` as a fixed starting point rather than reading/preserving the task's actual current streak.
- A static yellow "⚠️ Dev Mode Only" banner is shown unconditionally at the top of the page (it does not change based on environment — it's just a permanent warning label in the JSX, not an env-gated element).

### Access control — the actual gate

```tsx
if (!isAdmin) {
    return <Navigate to="/dashboard" />;
}
```

`isAdmin` comes from `AuthContext`, derived as `hasAdminClaim || profile.role === 'admin'` (a Firebase custom claim or a Firestore `role` field, either qualifying). This is a **client-side-only redirect** inside the component itself — confirmed via `App.tsx`'s route table: `/debug` is wrapped only in `PrivateRoute` (auth-required), with **no `VaultGate`** (consistent — no encrypted content is touched) and **no route-level role check**; the `isAdmin` gate lives entirely inside `DebugTools.tsx`'s own render logic, not in routing middleware.

**This means the redirect is a UI convenience, not a security boundary.** Any authenticated user (admin or not) can:
- Load `/debug` far enough for React to mount the component and evaluate `isAdmin` — a non-admin sees the immediate redirect and never sees the UI, so there's no *content* disclosure.
- More importantly, the actual Firestore *writes* this page performs (`updateDoc` on `tasks/{taskId}`) are authorized purely by `firestore.rules`' `tasks` block: `allow read, update, delete: if isResourceOwner();` — **ownership, not admin role**. Nothing server-side requires `isAdmin` for these specific field mutations. A non-admin user who opened browser devtools and called the same Firestore SDK methods directly (bypassing this page's UI and its `isAdmin` check entirely) could freely rewrite their own tasks' `status`/`lastCompletedAt`/`dueDate`/`currentStreak` fields — but this is not actually a *privilege escalation*: since the rule is ownership-based, that same non-admin user could always mutate their own task fields this way regardless of `DebugTools.tsx`'s existence — this page doesn't grant any capability a technically-inclined free user didn't already have via direct SDK/console access to their own data. What the client-side `isAdmin` check actually prevents is casual UI-level access, not a determined user manipulating their own tasks.

## Data model

Reads and writes `tasks/{id}` only — no dedicated debug-tools collection. Fields touched: `status`, `lastCompletedAt`, `dueDate`, `currentStreak` (all plaintext per CLAUDE.md's data table). See `docs/screens/tasks/README.md` for the full `tasks/{id}` schema.

## Gating & limits

- **Client-side only:** `isAdmin` check inside the component (`AuthContext`, derived from a custom claim or `profile.role === 'admin'`).
- **Route-level:** `PrivateRoute` (any authenticated user) — no admin check, no `VaultGate`.
- **Server-side (`firestore.rules`):** the `tasks` collection's `update` rule is ownership-based (`isResourceOwner()`), not admin-based — there is no rule anywhere restricting a user's ability to rewrite their own task's `currentStreak`/`lastCompletedAt` fields to arbitrary values, with or without this page existing.

## Known gaps / debt

- **This page is reachable in production** — nothing in `App.tsx`'s routing or `firestore.rules` restricts `/debug` to non-production environments; it's gated on `isAdmin` alone, client-side, at render time. If the intent is truly "dev-only" (as the in-page banner and this ticket's framing both suggest), there is currently no build-time or environment-based exclusion (e.g. an `import.meta.env.DEV` check, or a route registered only in non-prod builds) — it's live at `mrt2-app-prod` for any admin account, and technically mountable (briefly, before redirect) for any authenticated non-admin account too.
- **The `isAdmin` gate is UI-only for this page's own protection**, and — as noted above — doesn't actually widen what a non-admin user could already do to their own `tasks` docs via direct SDK calls, since `firestore.rules` authorizes those writes by ownership regardless of this page. The real risk isn't data-tampering capability (already possible) but the page being an easy, discoverable, one-click UI for it, and being reachable by any admin account (including a compromised one) without any additional confirmation step — no "are you sure" dialog on either simulate button.
- `currentStreak: 5` is hardcoded in both simulation functions rather than derived from or preserving the task's real value — a developer testing a task whose actual streak isn't 5 would get a misleading simulated state.

## Related docs

- `docs/screens/tasks/today.md`, `docs/screens/tasks/README.md` — the real Tasks UI whose streak/reset logic this page exists to help verify.
- CLAUDE.md's Zero-Knowledge Encryption Boundary table — confirms `tasks/{id}` is plaintext, consistent with this page's direct field manipulation.
