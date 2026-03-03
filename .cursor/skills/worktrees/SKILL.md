---
name: worktrees
description: Creates and manages git worktrees for isolated plan execution. Use when setting up a worktree for a plan, syncing with base branch, rebasing, or cleaning up worktrees. Never modify the main repo for plan work—all work happens in the worktree.
---

# Git Worktrees for Plans

**Rule:** All plan work happens in a **dedicated worktree**. Never do plan tasks in the main repo checkout.

## Create Worktree for a Plan

From the main repo directory:

```bash
# Convention: ../<repo-name>-worktrees/<plan-name>
git worktree add ../stream-chat-react-worktrees/<plan-name> -b <plan-branch-name>

# Example
git worktree add ../stream-chat-react-worktrees/gallery-redesign -b feat/gallery-redesign
```

- **Worktree path:** `../stream-chat-react-worktrees/<short-descriptive-name>`
- **Branch:** `feat/<descriptive-name>` (repo conventions)
- **Base:** current branch when creating

Then in plan.md include a **Worktree** section with path, branch, base branch. Agent must `cd` into the worktree before any work.

```bash
cd ../stream-chat-react-worktrees/<plan-name>
yarn install
```

## Sync with Base Branch (Rebase, Never Merge)

From the worktree:

```bash
cd ../stream-chat-react-worktrees/<plan-name>
git fetch origin
git rebase origin/<base-branch>
```

If conflicts: resolve → `git add <files>` → `git rebase --continue`. Do not `git rebase --abort` unless stuck. Then `yarn install`, `yarn types`, `yarn test`.

**When to sync:** Before a new phase, before final integration, when base changed. **Not** mid-task.

**Conflict rules:** Prefer base for files outside plan scope; prefer worktree for files the plan owns. After resolve, run `yarn types` and `yarn test`.

## Preview Branch (from main/master)

Keep a branch derived from `main` (or `master`) continuously updated with the worktree branch so others can preview by checking out that branch. **Name:** `agent/<branch-name>` (e.g. `agent/feat/gallery-redesign`).

**Create once (from main repo):**

```bash
git fetch origin
git checkout -b agent/<branch-name> origin/main   # e.g. agent/feat/gallery-redesign
git push -u origin agent/<branch-name>
```

**Update preview after commits in the worktree** (run from main repo):

```bash
cd /path/to/main/repo
git fetch origin
git checkout agent/<branch-name>
git merge feat/<plan-branch-name>
git push origin agent/<branch-name>
```

- Do this after each meaningful milestone or when someone needs to preview.
- Document in plan.md: **Preview branch:** `agent/<branch-name>` — checkout to preview.

## Lifecycle

**List worktrees:** `git worktree list`

**Remove after plan is merged (from main repo):**

```bash
cd /path/to/main/repo
git worktree remove ../stream-chat-react-worktrees/<plan-name>
git branch -d feat/<plan-branch-name>   # optional if merged
```

- Never delete a worktree with uncommitted changes (commit or stash first).
- Avoid `git worktree remove --force` unless no work will be lost.
- One worktree per plan; do not push from worktree without explicit approval.

For plan structure and task template, see the make-plans skill.

## Remote

Never push to remote.
