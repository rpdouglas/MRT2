#!/usr/bin/env bash
# PostToolUse hook (matcher: Edit|Write), async. Runs the project-wide
# TypeScript check after a source edit, so a cross-file type error surfaces
# immediately instead of at the next `npm run build`.
#
# Only fires for .ts/.tsx files — a full `tsc --noEmit` pass can never be
# affected by a docs/JSON/CSS/shell-script edit, so skip spawning it for
# those instead of paying the cost on every single Edit/Write.
set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')

case "$FILE_PATH" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

npx tsc --noEmit 2>&1 | tail -10 || true
exit 0
