#!/usr/bin/env bash
# Copy gitignored .env* files from the main git worktree into the current worktree.
#
# - No-op when run from the main worktree.
# - Idempotent: never overwrites an existing destination file.
# - Source is always the main worktree (first entry from `git worktree list`).
#
# Wired into Claude Code via the `SessionStart` hook in .claude/settings.json,
# so spawning a session with `claude -w <name>` auto-populates env files.
# Safe to invoke manually too.

set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  exit 0
fi

current="$(git rev-parse --show-toplevel)"
main="$(git worktree list --porcelain | awk '/^worktree/{print $2; exit}')"

if [ -z "$main" ] || [ "$current" = "$main" ]; then
  exit 0
fi

copied=0
while IFS= read -r -d '' rel; do
  rel="${rel#./}"
  dest="$current/$rel"
  [ -e "$dest" ] && continue
  mkdir -p "$(dirname "$dest")"
  cp -Lp "$main/$rel" "$dest"
  copied=$((copied + 1))
done < <(cd "$main" && find . \
  \( -name ".env" -o -name ".env.*" \) \
  -not -path '*/node_modules/*' \
  -not -path '*/.next/*' \
  -not -path '*/dist/*' \
  -not -path '*/.git/*' \
  -not -path '*/.claude/worktrees/*' \
  -not -name '.env.example' \
  -not -name '.env-example' \
  -not -name '.env.sample' \
  -print0)

if [ "$copied" -gt 0 ]; then
  echo "[copy-env] copied $copied env file(s) from $main"
fi
exit 0
