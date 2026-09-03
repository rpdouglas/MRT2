# Admin → Users — `/admin` (tab: users)

**Source:** `src/pages/AdminDashboard.tsx` (tab wiring only) + `src/components/admin/FriendsDirectory.tsx`
**Personas:** Alex (RBAC/compliance, per `docs/governance/INTERNAL_PERSONAS.md`) — this is also the only tab where CLAUDE.md's manual-VIP-grant mechanism (`tierSource: 'manual'`) actually lives.
**Tier:** N/A — not tier-gated; admin-only (see `docs/screens/admin/README.md`). This tab is where an admin *manages* other accounts' tier, not where its own tier matters.
**Zero-knowledge status:** `users/{uid}` is unencrypted profile metadata per CLAUDE.md's collection table. This tab reads/writes only `role`, `tier`, `tierSource`, plus display fields (`email`, `displayName`, `createdAt`, `lastLogin`) — nothing decrypted, no recovery content touched.

## What it does

"Friends Directory" (per `08_ADMIN.md`'s renaming — UI copy still says "Friends Directory" while the underlying collection stays `users`). Lists every account, shows three at-a-glance metrics, and lets an admin: promote/demote a user's `role`, grant/revoke a manual "VIP" premium tier, export the full list as CSV, or copy every listed email to the clipboard.

## How it works

- **Fetch:** one-shot on mount, `query(collection(db, 'users'), orderBy('lastLogin', 'desc'))` — **no `limit()`**, so every account in the collection is loaded in a single `getDocs` call. No live listener, no manual refresh, no re-fetch on tab revisit.
- **Analytics hero tiles** (computed client-side over the already-loaded `users` array, not separate queries): Total Users (`users.length`), Daily Active — 24h (`lastLogin.toDate() > oneDayAgo`), New — 30 Days (`createdAt.toDate() > thirtyDaysAgo`).
- **Role management** (`handleUpdateRole`): a `window.confirm` (copy differs for promote vs. demote), then `updateDoc(userRef, { role: newRole })`. This is exactly the "Promote to Admin" write the README describes in detail: it only ever touches the Firestore `role` field, itself gated by `isAdmin()` (custom claim) in `firestore.rules`, so only an existing real-claim admin can run it — and it grants the target account UI access only, not the custom claim. See the README's "Access control" section for the full mechanism; not re-derived here.
- **Manual VIP grant/revoke** (`handleGrantVIP`/`handleRevokeVIP`) — this is the mechanism CLAUDE.md's Premium Tier section calls out ("an admin (`FriendsDirectory.tsx`'s manual VIP grant, `tierSource: 'manual'`)"): `updateDoc(userRef, { tier: 'premium', tierSource: 'manual' })` to grant, `updateDoc(userRef, { tier: 'free', tierSource: null })` to revoke. **Asymmetric confirmation:** Revoke has a `window.confirm`; Grant does not — clicking "Grant VIP" writes immediately.
- **Tier badge rendering** (`renderTierBadge`) distinguishes three states purely from `tier`/`tierSource`: `tier === 'premium' && tierSource === 'manual'` → purple "VIP" badge; any other `tier === 'premium'` → green "Supporter" badge (i.e. Stripe- or Play-Billing-sourced, per CLAUDE.md's `tierSource` values); else → gray "Free" badge. The action column mirrors this: a manual-VIP row gets "Revoke VIP"; a non-premium row gets "Grant VIP"; a Stripe/Play-Billing-premium row gets a static "Stripe-Managed" label with no action (the app cannot revoke a subscription this admin doesn't manage).
- **Export CSV** (`handleExportCSV`): builds a CSV string client-side from the already-loaded `users` array (`UID,Email,DisplayName,Role,Tier,Joined,LastActive`) and triggers a browser download via `Blob` + `URL.createObjectURL` + a synthetic anchor click — no server round-trip.
- **Copy Emails** (`handleCopyEmails`): joins every loaded user's `email` (filtering out accounts with none) and writes it to the clipboard via `navigator.clipboard.writeText`, with `sonner` toast feedback (success count, or an error toast if there are no emails or the clipboard write fails).

## Data model

| Field on `users/{uid}` (as read/written by this tab) | Read or written here? | Notes |
|---|---|---|
| `uid`, `email`, `displayName` | Read | Display + CSV/copy-emails source. `displayName` falls back to `'Anonymous'`; `email` falls back to a truncated `uid` in the table. |
| `role` | Read + written | `'admin' \| 'user'`. Written only via the promote/demote buttons — same write path the README's access-control section documents in full. |
| `tier` / `tierSource` | Read + written | Written only via Grant/Revoke VIP, using the literal `'manual'` `tierSource` value (matches the `tierSource` union in `src/lib/db.ts`, unlike the Stripe path's known `'Stripe-Managed'` drift). |
| `createdAt` / `lastLogin` | Read | Both Firestore `Timestamp`; guarded with `?.toDate` before formatting, falling back to `'N/A'` / `'Never'`. Drive the "Joined" / "Last Active" columns and the analytics tiles. |

Per `firestore.rules`, `read` on any `users/{uid}` doc requires `isAdmin() || isOwner(uid)`; the general `update` rule blocks any client write to `tier`/`tierSource`/`role` unless `isAdmin()` passes — see the README for the full split-authority explanation.

## Gating & limits

None beyond the page-level admin gate (`docs/screens/admin/README.md`). No pagination, no search/filter box, and no per-action rate limit — a click on Grant VIP or Promote to Admin writes immediately (Promote/Demote and Revoke VIP go through a `window.confirm`; Grant VIP does not).

## Known gaps / debt

- **No pagination or search**, despite both admin specs describing this differently: `03_ADMIN.md` §2B calls it "View all users (**Paginated**)" and `08_ADMIN.md` §2B calls it a "**Searchable** list of all friends" — neither matches the code, which fetches the entire `users` collection in one unfiltered, unpaginated query and renders it as a flat table with no search input. Flag as spec/code drift; code is ground truth.
- **Grant VIP has no confirmation dialog** while every other mutating action on this tab (demote/promote, Revoke VIP) does — a manual premium grant (a monetization-bypass action) is one accidental click away.
- Export CSV and Copy Emails hand every listed user's email address to the browser (download or clipboard) with no audit trail of who exported what, when.
- No indication anywhere in the UI of *why* `isAdmin` might be true via the `role`-fallback path (see README §3) vs. the real custom claim — an admin looking at this table can't tell which other "admin"-badged rows actually have database-level access and which are UI-access-only until someone runs the out-of-band claim script.

## Related docs

- `docs/screens/admin/README.md` — parent index; **the authoritative source for the promote/demote access-control mechanism**, referenced rather than re-derived above.
- `docs/specs/08_ADMIN.md` §2B ("Friends Directory (formerly User Directory)") — current spec; note the pagination/search drift above.
- `docs/specs/03_ADMIN.md` §2B ("User Directory") — superseded.
