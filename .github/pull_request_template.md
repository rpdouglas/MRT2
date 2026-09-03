<!--
Guidance, not boilerplate: delete any section that's genuinely not applicable
and say why in one clause, rather than leaving it unanswered. An unanswered
section is what turns this into checkbox theater — the whole point is that a
human (you, reviewing your own or an agent's diff) can't wave it through
without evidence.
-->

## Summary
What changed and why, in 2-3 sentences. Not what the diff does line-by-line — why it needed to happen.

**Spec:** `docs/projects/XX_FEATURE.md` (link or PROJ-ID) — required for any new feature per `CLAUDE.md`. If this PR is a hotfix/chore with no spec, say so explicitly rather than leaving this blank.

---

## AI Involvement
- **Authored by:** [ Human / AI agent (name + session link) / Mixed ]
- **What the agent verified itself** (ran and observed, not just generated): e.g. "ran `npm run check`, dry-ran the script's guard conditions, read the resulting file top to bottom"
- **What still needs a human look:** be specific — the thing you didn't/couldn't verify (no browser session, no prod access, a judgment call on tone/scope, etc.), not "everything" or "nothing." If genuinely nothing, say why you're confident (e.g. "pure mechanical rename, covered by existing test suite").

An agent's own review or approval of this PR does not satisfy the review requirement — a human still needs to look, same as any other contribution.

---

## Evidence
Paste actual output, not a checkbox. "Tests pass" unaccompanied by output is an assertion, not evidence.
```
$ npm run check
...
```
- [ ] Manually exercised the changed flow in a browser (or state why not possible in this environment)
- [ ] Deviations from the spec/plan found during implementation are called out above or in the linked spec's "Approved deviations" note — not left implicit in the diff

---

## Scope check
- [ ] Diff size is proportionate to the task — no incidental refactors, redundant abstractions, or drive-by changes bundled in. If something adjacent got touched, it's called out above with a reason.

---

## Zero-Knowledge & Security Boundary
*Skip only if this PR touches no Firestore writes, encryption, or auth/permission logic.*
- [ ] Any new/changed Firestore write of user content passes through `encryptData()`/`encrypt()` per `CLAUDE.md`'s ZK boundary table
- [ ] Any new plaintext field in an encrypted collection is intentional metadata, and the boundary table is updated to reflect it
- [ ] Any change to an auth/permission boundary (Firestore rules, Cloud Function auth checks, admin gating) names the specific boundary touched

---

## Public Changelog Classification
*Mirrors the `ticket-close` skill's Check 0 (PROJ-69/70) — the changelog is public and reaches users, including mid-crisis via the in-app update toast.*
- [ ] **Not user-visible** — internal/infra/tech-debt, no `docs-site/support/changelog.md` entry
- [ ] **User-visible** — plain-language note drafted below, no ticket IDs/file names/internal reasoning:
  > (note here, or delete this line if not user-visible)
- [ ] If this involves a security/credential incident: confirmed no changelog entry, softened or otherwise, per the hard rule in `ticket-close`

---

## User Guide Review
*Mirrors the `ticket-close` skill's Check 3 — blocking, not advisory, when this PR adds new user-facing UI or behaviour.*
- [ ] Reviewed `docs-site/guide/*.md` for this change's feature entry point, rate limits, vault-locked/offline states, free-vs-Premium distinction, and gamification impact — updated where needed, or confirmed no update needed
- [ ] If this is significant enough to warrant its own guide page (a new module or major workflow), that page has been added — not deferred silently

---

## Persona Check
*Skip only for pure backend/infra changes with no UI surface.* How does this feel for David, using the app in an acute-crisis state? Max 3 taps, zero cognitive load, no red/alarming states for things that aren't emergencies.
