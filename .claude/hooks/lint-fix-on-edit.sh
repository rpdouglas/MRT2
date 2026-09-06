#!/usr/bin/env bash
# PostToolUse hook (matcher: Edit|Write). Auto-fixes lint issues in the file
# that was just edited/written.
#
# Claude Code does not populate a $CLAUDE_TOOL_INPUT_FILE_PATH env var (that
# was this hook's previous, silently-broken implementation) — tool_input is
# delivered as JSON on stdin, same as the PreToolUse secrets-scan.sh hook.
#
# Only fires for .ts/.tsx files — everything else (docs, JSON, CSS, shell
# scripts, etc.) exits before spawning eslint at all.
set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')

case "$FILE_PATH" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

npx eslint --fix "$FILE_PATH" 2>&1 | tail -5 || true
exit 0
