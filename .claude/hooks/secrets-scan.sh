#!/usr/bin/env bash
# PreToolUse hook (matcher: Bash). Fires on every Bash call; only acts on `git commit`.
# Scans the staged diff for likely secrets and denies the commit if any are found.
# This only guards commits Claude runs through the Bash tool — it is not a real git
# pre-commit hook, so it does not protect commits made directly in a terminal.
set -euo pipefail

INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // .tool_input.CommandLine // .CommandLine // .command // empty')

if ! printf '%s' "$COMMAND" | grep -qE '(^|[;&|]|[[:space:]])git[[:space:]]+commit([[:space:]]|$)'; then
  exit 0
fi

REPO_DIR=$(printf '%s' "$INPUT" | jq -r '.cwd // empty')
if [ -n "$REPO_DIR" ] && [ -d "$REPO_DIR" ]; then
  cd "$REPO_DIR"
fi

DIFF=$(git diff --cached -U0 2>/dev/null || true)
if [ -z "$DIFF" ]; then
  exit 0
fi

ADDED=$(printf '%s\n' "$DIFF" | grep -E '^\+[^+]' || true)
if [ -z "$ADDED" ]; then
  exit 0
fi

declare -a HITS=()

scan() {
  local label="$1"
  local pattern="$2"
  local m
  m=$(printf '%s\n' "$ADDED" | grep -Po -- "$pattern" 2>/dev/null | head -3 || true)
  if [ -n "$m" ]; then
    HITS+=("${label}: $(printf '%s' "$m" | tr '\n' ' ' | cut -c1-160)")
  fi
}

scan "Private key block"       '\-\-\-\-\-BEGIN[ A-Z]*PRIVATE KEY\-\-\-\-\-'
scan "AWS access key ID"       'AKIA[0-9A-Z]{16}'
scan "Google/Firebase API key" 'AIza[0-9A-Za-z_-]{35}'
scan "Stripe live secret key"  'sk_live_[0-9a-zA-Z]{16,}'
scan "GitHub token"            'gh[pousr]_[A-Za-z0-9]{36,}'
scan "Slack token"             'xox[baprs]-[0-9A-Za-z-]{10,48}'
scan "JWT-shaped token"        'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'

# Hardcoded credential assignment, e.g. apiKey: "abc123...". Excludes references to
# env vars (import.meta.env / process.env) since those are not embedded literals —
# and Firebase's client-side apiKey is not a secret by design, but a literal string
# assigned to a *_key/*_secret/*_token name anywhere else is worth a human look.
CRED_LINES=$(printf '%s\n' "$ADDED" \
  | grep -P '(api.?key|secret.?key|access.?token|client.?secret)[[:space:]]*[:=][[:space:]]*.{0,2}[A-Za-z0-9_-]{16,}' 2>/dev/null \
  | grep -Ev 'import\.meta\.env|process\.env' \
  | head -3 || true)
if [ -n "$CRED_LINES" ]; then
  HITS+=("Hardcoded credential assignment: $(printf '%s' "$CRED_LINES" | tr '\n' ' ' | cut -c1-160)")
fi

if [ "${#HITS[@]}" -eq 0 ]; then
  exit 0
fi

REASON="secrets-scan found likely secret(s) in the staged diff:"$'\n'
for h in "${HITS[@]}"; do
  REASON="${REASON}- ${h}"$'\n'
done
REASON="${REASON}"$'\n'"If genuine: unstage the file, remove/rotate the secret, and retry the commit. If this is a false positive (test fixture, placeholder, non-secret Firebase client config), confirm with the user before committing anyway."

jq -n --arg reason "$REASON" '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $reason}}'
exit 0
