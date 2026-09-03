# Admin → Feedback — `/admin` (tab: feedback)

**Source:** `src/components/admin/FeedbackViewer.tsx` (this tab) + `src/components/FeedbackModal.tsx` (the write side, elsewhere in the app — not part of this tab but needed to explain the data model)
**Personas:** Taylor (Support & Moderation — primary day-to-day operator per the README).
**Tier:** N/A — not tier-gated; admin-only (see `docs/screens/admin/README.md`).
**Zero-knowledge status:** `feedback` is unencrypted per `firestore.rules`/CLAUDE.md's collection scope (not itself in CLAUDE.md's table, but architecturally identical to `client_errors`/`ai_logs`: operational, not recovery, content). `FeedbackModal.tsx`'s submission UI carries an explicit in-product privacy notice — *"This box is unencrypted. Do not include sensitive journal entries or your PIN"* — a product-level mitigation for a field that is technically plaintext by design, not a ZK boundary claim.

## What it does

"Feedback Inbox" (per `08_ADMIN.md`) — a live-updating triage board for user-submitted bug reports / suggestions / content notes. Reports are grouped into four status columns (New, Backlog, Investigating, Resolved/Archive), each an independently collapsible accordion. An admin can move a report between statuses, open a pre-filled GitHub issue for it in a new tab, or copy a Markdown triage summary of everything currently tagged "Investigating."

## How it works

- **Fetch:** unlike Analytics/Health's one-shot capped fetches, this tab uses a **live listener**: `onSnapshot(query(collection(db, 'feedback'), orderBy('timestamp', 'desc')))` — **no `limit()`**, so it holds an open realtime subscription over the entire `feedback` collection for as long as the component is mounted (unsubscribed on unmount).
- Each snapshot doc is defensively normalized: `message: raw.message || raw.content || ''` (a fallback to a `content` field name the current write path — `FeedbackModal.tsx` — does not use, suggesting either a legacy field-name variant from an earlier version or defensive-by-habit code; not confirmed either way in the code) and `status: raw.status || 'new'`.
- **Grouping** (`groupedReports`, `useMemo`): four buckets filtered by `status` — `new`, `backlog`, `investigating`, `resolved`.
- **Status change** (`updateStatus`): a `<select>` per report card, `updateDoc(doc(db, 'feedback', id), { status: newStatus })` on change — no confirmation dialog, writes immediately.
- **"Create GitHub Issue"** (`sendToGitHub`, per-card button): opens `https://github.com/rpdouglas/MRT2/issues/new?title=...&body=...` in a new tab — a hardcoded repo URL, not configurable in-app. The pre-filled Markdown body includes the report's `message`, `route`, `environment`, `buildHash`, `vaultUnlocked`, `userAgent`, and the Firestore doc id — it deliberately (by omission, not by a code comment stating intent) leaves out `uid` and `email`, both of which exist on the underlying doc per the write side below, which keeps that PII out of what could become a public GitHub issue. This is a browser deep-link only — no GitHub API call, no auth to GitHub from the app.
- **"Triage Report"** (`generateTriageReport`): operates only on the `investigating` bucket; groups those reports by `route` (falling back to `'Global/Unknown'`), builds a Markdown checklist (one `- [ ]` line per report, first line of `message` plus environment/vault-unlocked/date), and copies it to the clipboard (`navigator.clipboard.writeText`) with an `alert()` confirmation. `alert()`s a different message and returns early if the Investigating bucket is empty.

## Data model

| Field on `feedback/{id}` (as read by `FeedbackReport`) | Written by | Notes |
|---|---|---|
| `category` | `FeedbackModal.tsx` | `'bug' \| 'suggestion' \| 'content'`. |
| `message` | `FeedbackModal.tsx` | Free text; the read side also checks a `content` fallback (see above). |
| `status` | `FeedbackModal.tsx` (implicit — not set at creation, so defaults via `raw.status \|\| 'new'`), this tab | `'new' \| 'backlog' \| 'investigating' \| 'resolved'`. |
| `buildHash`, `environment`, `route` | `FeedbackModal.tsx` (`useBuildInfo()`, `window.location.pathname`) | Reproduction context. |
| `vaultUnlocked` | `FeedbackModal.tsx` (`useEncryption().isVaultUnlocked`) | Whether the vault was unlocked at submission time. |
| `userAgent` | `FeedbackModal.tsx` | `navigator.userAgent`, full string (unlike Health's truncated version). |
| `timestamp` | `FeedbackModal.tsx` (`serverTimestamp()`) | Sort key. |
| `uid`, `email` | `FeedbackModal.tsx` — *"Unencrypted for admin contact"* per its own code comment | **Not** in `FeedbackViewer`'s typed `FeedbackReport` interface and not rendered anywhere in this tab, but present on the raw doc (reaches this component only via the object spread `...raw`, unused). |

Per `firestore.rules`: `feedback` allows `create: if isCreatingOwnedResource()` (any authenticated user, via `FeedbackModal.tsx`) and `read, update, delete: if isAdmin()` — this tab is the only in-app reader/writer of report status.

## Gating & limits

Page-level admin gate only (`docs/screens/admin/README.md`). No pagination or `limit()` on the live query, no search/filter within a status bucket, no confirmation before a status change.

## Known gaps / debt

- **Unbounded live listener:** no `limit()` clause means this is a full-collection realtime subscription that only grows — distinct from (and more expensive at scale than) Analytics's and Health's capped 100-doc one-shot fetches.
- **No confirm/undo on status changes** — unlike the Users tab's role/VIP mutations (which mix confirmed and unconfirmed actions), every status change here is immediate and silent, with no record of who changed it or when.
- **Hardcoded GitHub repo URL** (`rpdouglas/MRT2`) in `sendToGitHub` — a repo rename or ownership change breaks this silently, with no in-app fallback or error state.
- The `raw.content` read-side fallback for `message` has no corresponding writer anywhere found in the codebase — either dead defensive code or evidence of a since-removed write path; flagged as unclear rather than assumed.

## Related docs

- `docs/screens/admin/README.md` — parent index, access control.
- `docs/specs/08_ADMIN.md` §2C ("Feedback Inbox (New)") — current spec; the "(New)" tag matches this feature's absence from `03_ADMIN.md`.
- `docs/specs/03_ADMIN.md` — superseded, and predates this tab entirely (no Feedback section).
