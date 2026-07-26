---
name: release-scribe
description: Maintenance Protocol C (Release Scribe) from the Recursive Build Protocol. Audits unreleased user-visible work against docs-site/support/changelog.md before a merge to main, so nothing user-facing ships without a plain-language entry. Run before merging to main.
---

# MRT Release Scribe

Per `docs/governance/DEVELOPER_GUIDE.md` §Protocol C: document user-facing changes in `docs-site/support/changelog.md` before merging to `main`.

**This skill audits for gaps — it does not replace `ticket-close`.** `ticket-close`'s Check 0 already drafts a `--public-note` per ticket and `sync_ticket_docs.py --public-note ... --apply` is the actual mechanism that appends to the changelog. Use this skill when you need to check *across* recent work — e.g. right before a `main` merge — whether anything user-visible shipped without going through that path.

## When invoked, do this

1. Read the top few entries of `docs-site/support/changelog.md` to find the most recent logged version and date.
2. Read `docs/ACTIVE_CYCLE.md`'s `## ✅ Resolved This Cycle` section — every entry resolved after the changelog's last date is a candidate.
3. For each candidate, apply the same user-visible classification `ticket-close` Check 0 uses: did this change anything an end user can see, feel, or experience? Skip pure refactors/tech-debt/CI/infra/dependency bumps.
4. For every user-visible item **not** already reflected in the changelog, that's a gap — list it.
5. **Never draft or apply the fix yourself with a one-off script or direct edit.** Route each gap through the existing tool:
   ```bash
   python scripts/sync_ticket_docs.py --proj PROJ-XX --summary "..." --public-note "Plain-language description." --version X.Y.Z --apply
   ```
   Draft the `--public-note` text per `ticket-close`'s own rules (plain language, no `PROJ-` ID, no file/hook/component names, one sentence per distinct change, and the hard rule that security incidents/credential rotations never get a changelog note even softened).
6. If a gap involves a security incident or credential rotation, do not draft a note at all — flag it to the user as a direct-communication decision, same as `ticket-close`.

## Output

```
### 📰 Release Scribe Audit — [date]

**Changelog last entry:** v[X.Y.Z] — [date]
**Resolved-this-cycle items since then:** N

#### Gaps (user-visible, not yet in changelog)
[PROJ-ID or item] | [one-line description] | proposed --public-note text

#### Correctly excluded (internal-only, verified)
[PROJ-ID or item] | [why it's internal]

**Next step:** run `sync_ticket_docs.py` for each gap above (one call per item, or batch if the script supports it) — do not proceed without confirming the drafted note text first.
```
