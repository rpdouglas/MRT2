---
name: secrets-scan
description: Manual secrets sweep across the whole repo (or a given path/history range), complementing the automatic PreToolUse hook that already blocks Claude-driven git commits containing likely secrets. Use for a one-off deep check — new clone, before a public release, or after suspecting a leak.
---

# MRT Secrets Sweep

There are two layers of secrets protection in this repo:

1. **Automatic, narrow**: `.claude/hooks/secrets-scan.sh` runs as a `PreToolUse` hook on every `Bash` call, denies any `git commit` whose *staged diff* trips a pattern match (private keys, AWS/Google/Stripe/GitHub/Slack tokens, JWT-shaped strings, hardcoded `apiKey`/`secret`/`token` literal assignments). It only fires when Claude runs `git commit` through the Bash tool — it does **not** protect commits made directly in a terminal outside Claude Code, and it only ever looks at the diff being committed right now.
2. **This skill, manual and broad**: invoke it explicitly to sweep more than just a pending commit.

## When invoked, do this

1. Confirm scope with context: whole working tree (`git ls-files`), a specific path, or recent history (`git log -p -- <range>`)? Default to the whole tracked working tree if unspecified.
2. Reuse the same pattern set as the hook (read `.claude/hooks/secrets-scan.sh` for the current list rather than re-deriving it, so the two stay in sync) — private key blocks, AWS/Google/Stripe/GitHub/Slack token shapes, JWT-shaped strings, hardcoded credential-looking assignments excluding `import.meta.env`/`process.env` references.
3. For history sweeps, remember `git log -p` prints full diffs — grep it the same way, but be aware a matched secret in history is **not fixed by editing the current file**; it requires the same remediation PROJ-67 used for the leaked keystore (`git filter-repo` + force-push + rotation), which is a destructive, high-blast-radius operation. Never run that without explicit user approval — flag it and stop.
4. Report every hit with file/commit, matched pattern label, and a redacted snippet (first/last few characters only — do not print the full secret value into chat history or logs).
5. For each hit, recommend: rotate the credential (if real), and if it's in history (not just working tree), escalate to the user rather than acting — this needs the same care as PROJ-67's key-rotation incident.

## Output

```
### 🔎 Secrets Sweep — [scope] — [date]

[file:line or commit] | [pattern label] | [redacted snippet]

Recommendation: [rotate + how] / [false positive, no action] / [history leak — needs filter-repo, escalate to user before doing anything]
```
