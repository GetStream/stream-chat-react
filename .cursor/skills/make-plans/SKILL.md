---
name: make-plans
description: Structures plan.md files for parallel, non-overlapping agent work. Use when creating or editing execution plans, task lists for multiple agents, or when the user asks how to structure plans or split work into tasks.
---

# Making plan.md Files

Plans enable **parallel, non-overlapping work**. Each task must be independent; agents work in a **dedicated git worktree** (see worktrees skill).

## Required plan.md Structure

1. **Worktree section** (top) — path, branch, base branch. See worktrees skill.
2. **Task overview** — one line: tasks are self-contained; same-file tasks have dependencies.
3. **Task sections** — each with the template below.
4. **Execution order** — phases showing what can run in parallel.
5. **File ownership summary** — table: Task | Creates/Modifies.

## Task Template

Every task must include:

```md
## Task N: <Descriptive Name>

**File(s) to create/modify:** `path/to/file.tsx`

**Dependencies:** Task X (or "None")

**Status:** pending | in-progress | done | blocked

**Owner:** <agent-name> | unassigned

**Scope:**

- Bullet points; include interfaces/snippets if helpful

**Acceptance Criteria:**

- [ ] Verifiable condition
- [ ] e.g. TypeScript compiles, exports from module
```

## Task Independence Rules

- **Same file → cannot run in parallel.** Add explicit dependencies so only one agent touches a file at a time.
- **Explicit dependencies:** If B needs A, write `**Dependencies:** Task 1`.
- **Self-contained scope:** Task must be doable without other in-progress tasks (include types, imports, exports).
- **Same-file options:** Either one integration task (e.g. "Update index.tsx for all components", deps: 1–4) or a chain (Task 7 adds A, Task 8 adds B with dep Task 7).

## Task Granularity

- **Too coarse:** "Implement entire Gallery" — not parallelizable.
- **Too fine:** Separate tasks for "create file", "add imports", "add type" — overhead.
- **Good:** One task = one logical unit (e.g. "GalleryContext: types + context + hook", "Gallery Provider: state + navigation", "GalleryUI: rendering + interactions").

## Cross-Cutting / Integration

Use a final integration task, e.g.:

- Update `index.tsx` exports for all new components.
- Update main stylesheet to import component styles.
- Dependencies: all preceding tasks.

## Checklist Before Finalizing plan.md

- [ ] Worktree section at top
- [ ] Same-file tasks have dependencies
- [ ] Dependencies explicit; execution order and file ownership table present
- [ ] Tasks sized appropriately; each has Status, Owner, acceptance criteria

For full examples and worktree setup, see [reference.md](reference.md) and the worktrees skill.
