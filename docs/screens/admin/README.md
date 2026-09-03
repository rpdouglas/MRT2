# Admin — `/admin`

**Parent page:** `src/pages/AdminDashboard.tsx` — a shell that renders one of five tabs based on local component `useState<'analytics' | 'users' | 'health' | 'feedback' | 'maintenance'>('analytics')`. Unlike `/journal`'s `?tab=` search param, tab selection here is **not** reflected in the URL — a refresh always lands back on Analytics, and there is no deep link to a specific tab.

This is internal operational tooling, not an end-user screen — it gets its own folder for the same reason `/journal` does: five sub-experiences with distinct data sources, each independently readable.

| Tab | File | Component(s) | Source collection(s) |
|---|---|---|---|
| Analytics | [`analytics.md`](./analytics.md) | `AnalyticsCharts.tsx` | `ai_logs` |
| Users | [`users.md`](./users.md) | `FriendsDirectory.tsx` | `users` |
| Health | [`health.md`](./health.md) | `ErrorLogViewer.tsx` | `client_errors` (+ Gemini, approved flow) |
| Feedback | [`feedback.md`](./feedback.md) | `FeedbackViewer.tsx` | `feedback` |
| Maintenance | [`maintenance.md`](./maintenance.md) | `DeduplicationTool.tsx`, `SchemaMigration.tsx` | `journals`, `insights` (admin's own account only — see that file) |

**Personas:** Not a user-facing screen — none of David/Ned/Lisa/Walt/Maya/Jordan apply. This is Alex (CEO/Product Owner — cost monitoring via Analytics, RBAC/compliance via Users) and Dev/AI Partner territory architecturally, with Taylor (Support & Moderation) as the primary day-to-day operator of the Health and Feedback tabs specifically ("Admin feedback dashboards, bug reporting databases" per `docs/governance/INTERNAL_PERSONAS.md` §1). See that doc for the full internal-stakeholder framework — it governs code/business concerns here, not UX for recovery personas.

**Tier:** Not tier-gated itself — access is role-based (see below), orthogonal to the free/premium `users/{uid}.tier` system. The Users tab is where an admin *manages* other accounts' tier (manual VIP grants), but the Admin Dashboard itself has no relationship to the requesting admin's own tier.

**Zero-knowledge status:** Every collection this page touches directly is **unencrypted** by design (`ai_logs`, `client_errors`, `feedback`, and the plaintext-only fields of `users/{uid}` — see CLAUDE.md's collection table). No tab decrypts `journals`/`workbook_answers`/`service` content. The one AI-analysis call made from this page (`ErrorLogViewer.tsx` → `analyzeSystemHealth`) is one of CLAUDE.md's nine approved Gemini flows, and — verified in `health.md` — its payload is an aggregated summary of error messages/stack traces/browser strings, not decrypted user recovery content. The Maintenance tab's `DeduplicationTool` reads `journals.content`, but only to compare ciphertext strings for exact-duplicate detection — it never decrypts (see `maintenance.md`).

## Access control (applies to the whole page)

Verified directly in `src/App.tsx`, `src/pages/AdminDashboard.tsx`, `src/contexts/AuthContext.tsx`, and `firestore.rules`. This is a **split-authority** model — matches `docs/specs/08_ADMIN.md` §1 exactly, and code confirms that spec (not the superseded `03_ADMIN.md`) is current:

1. **Route level (`/admin` in `App.tsx`):** wrapped only in the generic `<PrivateRoute>` — i.e. "is there a logged-in Firebase Auth user at all." `PrivateRoute` has no role or admin check of its own; any authenticated user can navigate to `/admin` and the route will render `AdminDashboard`.
2. **UI gate (`AdminDashboard.tsx`):** `const { user, isAdmin } = useAuth(); if (!isAdmin) return <Navigate to="/dashboard" />;` — this is the only thing standing between a non-admin authenticated user and the tab UI. It runs client-side.
3. **`isAdmin` itself (`AuthContext.tsx`, on every auth-state change):**
   ```
   const hasAdminClaim = !!idTokenResult.claims.admin;
   const isAdminUser = hasAdminClaim || profile.role === 'admin';
   ```
   True if **either** the Firebase Auth custom claim `admin: true` is set, **or** the Firestore `users/{uid}.role` field equals `'admin'`. The `role`-field path is a deliberately-kept fallback (PROJ-99 Phase 5) — every time it's the *sole* reason `isAdmin` resolves true (claim absent, role present), `trackAdminRoleFallbackUsed()` fires (no PII) so the team can eventually confirm it's safe to drop.
4. **Database level (`firestore.rules`):** `function isAdmin() { return request.auth != null && request.auth.token.admin == true; }` — checks **only** the custom claim, never the `role` field. This is the real security boundary: it gates `read` on `ai_logs`, `read`/`delete` on `client_errors`, `read`/`update`/`delete` on `feedback`, `read` on any `users/{uid}` profile, and — critically — the general `users/{uid}` `update` rule blocks any client write to `tier`, `tierSource`, `role`, `pinAttempts`, or `lastWorkbookCoachCall` unless `isAdmin()` (custom claim) passes.

**The consequence, stated plainly (and exactly what `08_ADMIN.md` §1's "Constraint" describes):** promoting a user to admin from the Users tab (`FriendsDirectory.tsx`'s "Promote to Admin" button, `updateDoc(userRef, { role: 'admin' })`) only ever writes the Firestore `role` field — that write is itself gated by `isAdmin()` at the rules layer, so only an existing real-claim admin can do it. It grants the promoted account **UI access** to `/admin` (steps 2–3 above) immediately. It does **not** grant that account the custom claim, so every actual privileged Firestore operation on this page (reading `ai_logs`/`client_errors`/`feedback`, deleting error logs, updating feedback status, granting VIP/role to *other* users) will still be denied by `firestore.rules` for that account until someone runs `scripts/set_admin_role.cjs <email>` (a local Node script using the Firebase Admin SDK + a `service-account.json`, invoked outside the app) to actually set `admin: true` as a custom claim — after which the promoted user must sign out and back in for the new ID token to carry it.

In short: the in-app "Promote to Admin" button is UI-access-only and cannot itself create a database-level admin. Anyone relying on it alone to fully admin-enable an account will find every mutation on this page silently fails with a Firestore permission error until the out-of-band script runs.

## Related docs

- `docs/specs/08_ADMIN.md` — current, authoritative spec (RBAC split-authority model); code confirms it's accurate.
- `docs/specs/03_ADMIN.md` — superseded by `08_ADMIN.md`; kept for history, do not treat as current.
- `docs/governance/INTERNAL_PERSONAS.md` — Alex/Dev/Morgan/Taylor stakeholder personas this page serves.
- `docs/projects/99_FIRESTORE_BACKEND_HARDENING.md` §Phase 5 — the `role`-fallback telemetry and planned convergence.
