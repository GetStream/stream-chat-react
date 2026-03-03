# make-plans — Full Reference

Source: `.ai/MAKE_PLAN.md`. Condensed in SKILL.md; details here.

## Execution Order Example

```md
## Execution Order

Phase 1 (Parallel):
├── Task 1: Context
├── Task 5: Styles A
└── Task 6: Styles B

Phase 2 (After Task 1):
├── Task 2: Provider
└── Task 3: UI Component

Phase 3 (After Tasks 2, 3):
└── Task 4: Composition Component
```

## File Ownership Example

```md
## File Ownership Summary

| Task | Creates/Modifies |
| ---- | ---------------- |
| 1    | `Context.tsx`    |
| 2    | `Provider.tsx`   |
| 3    | `UI.tsx`         |
```

## Worktree Section (must appear in plan.md)

```md
## Worktree

**Worktree path:** `../stream-chat-react-worktrees/<plan-name>`
**Branch:** `feat/<plan-branch-name>`
**Base branch:** `<branch-this-was-created-from>`
**Preview branch:** `agent/<branch-name>` — branch from main; merge worktree branch into it so others can checkout to preview (e.g. `agent/feat/gallery-redesign`).

All work for this plan MUST be done in the worktree directory, NOT in the main repo checkout.
```

Actual creation and sync of worktrees is covered by the worktrees skill.
