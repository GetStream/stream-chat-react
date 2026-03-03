---
name: ralph-protocol
description: Collaboration protocol for Ralph loop (Plan → Act → Reflect → Refine). Use when working from goal.md, plan.md, state.json, decisions.md; when executing tasks in a shared plan; or when the user mentions Ralph, multi-agent, or file-based collaboration.
---

# Ralph Protocol (Agent Collaboration)

Files are the source of truth. All agents share memory via files. No silent decisions. Always update state after acting. Prefer small, explicit updates.

## Required Files

| File             | Purpose                                                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **goal.md**      | What we achieve; success criteria; constraints; non-goals. Read first. Only change if goal actually changes. No implementation details.                                                   |
| **plan.md**      | How we achieve it. Ordered tasks, ownership, dependencies, status (`pending \| in-progress \| done \| blocked`). Propose changes before big deviations; don't rewrite completed sections. |
| **state.json**   | Current memory. Task statuses, flags (`blocked`, `needs-review`, etc.). Update immediately after acting. Read before assuming anything.                                                   |
| **decisions.md** | Log of non-trivial decisions (what + why). Append only; never delete. Prevents reopening or contradicting past choices.                                                                   |

## Workflow

**Before acting:** Read goal.md → plan.md → state.json → decisions.md.

**During:** Follow the plan; no overlapping work unless coordinated; no undocumented decisions.

**After:** Update state.json → record decisions in decisions.md → update task status in plan.md. Optionally add learnings to observations.md.

**Prohibited:** Decisions without recording; using chat as memory; re-solving done problems; changing goals implicitly; overwriting files without explanation.

## Task ownership (critical)

- Work on **exactly one** task at a time.
- That task must be in plan.md, marked `in-progress` and assigned to you.
- Do not change files for other tasks, even if small.

## Commit scope

Only commit files that were changed for the **current** task. Use `git add <file>` — never `git add -A` or `git add .`. Leave unrelated changes unstaged.

## UI E2E

When acceptance criteria involve UI: use Playwright (MCP or project config). Take screenshots for success and failure. Save to a clear location (e.g. `__tests__/screenshots/`).

## Loop reminder

Each iteration: Plan (update plan.md if needed) → Act (scoped work) → Reflect (learnings) → Refine (plan or decisions).

For decision log format and state.json example, see [reference.md](reference.md). Plan structure and worktrees: use make-plans and worktrees skills.
