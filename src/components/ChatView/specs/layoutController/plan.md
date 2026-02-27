# ChatView Layout Controller Implementation Plan

## Worktree

**Worktree path:** `../stream-chat-react-worktrees/chatview-layout-controller`
**Branch:** `feat/chatview-layout-controller`
**Base branch:** `master`
**Preview branch:** `agent/feat/chatview-layout-controller`

All work for this plan MUST be done in the worktree directory, NOT in the main repo checkout.

## Task overview

Tasks are self-contained and parallelizable where files do not overlap; same-file changes are explicitly chained.

## Spec reference

Primary spec for this plan:

- `src/components/ChatView/specs/layoutController/spec.md`

## Task 1: Core Types and Controller Engine

**File(s) to create/modify:** `src/components/ChatView/layoutController/LayoutController.ts`, `src/components/ChatView/layoutController/layoutControllerTypes.ts`

**Dependencies:** None

**Status:** done

**Owner:** codex

**Scope:**

- Define `LayoutEntityBinding`, `ChatViewLayoutState`, `ResolveTargetSlotArgs`, `OpenResult`.
- Implement `createLayoutController` with `state: StateStore<ChatViewLayoutState>`.
- Implement commands: `setActiveView`, `setMode`, `bind`, `clear`, `open`, `openChannel`, `openThread`, `openMemberList`, `openUserList`, `openPinnedMessagesList`, `toggleEntityListPane`, `setEntityListPaneOpen`.
- Enforce `occupiedAt` invariant when occupying/clearing slots.
- Implement duplicate entity handling (`duplicateEntityPolicy`, `resolveDuplicateEntity`) and result semantics.

**Acceptance Criteria:**

- [x] Controller compiles with strict typing and no `any` leaks.
- [x] `open(...)` returns `opened` / `replaced` / `rejected` consistently.
- [x] `occupiedAt` is set on occupy and removed/reset on clear.

## Task 2: Resolver Registry and Built-in Strategies

**File(s) to create/modify:** `src/components/ChatView/layoutSlotResolvers.ts`

**Dependencies:** Task 1

**Status:** done

**Owner:** codex

**Scope:**

- Add reusable resolvers: `requestedSlotResolver`, `firstFree`, `existingThreadSlotForThread`, `existingThreadSlotForChannel`, `earliestOccupied`, `activeOrLast`, `replaceActive`, `replaceLast`, `rejectWhenFull`.
- Add `composeResolvers`.
- Export `resolveTargetSlotChannelDefault` with documented chain.
- Export central `layoutSlotResolvers` object.

**Acceptance Criteria:**

- [x] `layoutSlotResolvers.resolveTargetSlotChannelDefault` matches spec behavior.
- [x] Resolver functions are independently testable and exported.

## Task 3: ChatView Integration (Context and Props)

**File(s) to create/modify:** `src/components/ChatView/ChatView.tsx`, `src/components/ChatView/index.tsx`

**Dependencies:** Task 1, Task 2

**Status:** done

**Owner:** codex

**Scope:**

- Integrate controller into `ChatView` provider.
- Add new props: `maxSlots`, `resolveTargetSlot`, `duplicateEntityPolicy`, `resolveDuplicateEntity`, optional `entityInferers`, optional external `layoutController`.
- Expose `layoutController` via `useChatViewContext`.
- Keep existing `activeChatView` compatibility path (alias/mapping to `activeView`) or provide migration shim.
- Wire default resolver fallback when `resolveTargetSlot` is absent.

**Acceptance Criteria:**

- [x] Existing ChatView usage does not break at runtime.
- [x] New props and context are typed/exported.
- [x] `str-chat__chat-view` behavior remains stable for existing layouts.

## Task 4: Header Toggle Wiring for Entity List Pane

**File(s) to create/modify:** `src/components/ChannelHeader/ChannelHeader.tsx`

**Dependencies:** Task 3

**Status:** done

**Owner:** codex

**Scope:**

- Update header toggle button behavior to call ChatView controller (`toggleEntityListPane`) by default.
- Keep external override behavior (`onSidebarToggle`) intact.
- Ensure `sidebarCollapsed` derives from `entityListPaneOpen` when not controlled.

**Acceptance Criteria:**

- [x] Header toggle hides/shows entity list pane via ChatView state.
- [x] Override prop still takes precedence when provided.

## Task 5: Built-in Two-Step DX Layout API

**File(s) to create/modify:** `src/components/ChatView/ChatView.tsx`, `src/components/ChatView/layout/WorkspaceLayout.tsx` (new)

**Dependencies:** Task 3

**Status:** done

**Owner:** codex

**Scope:**

- Add optional built-in layout mode (`layout='nav-rail-entity-list-workspace'`).
- Add `slotRenderers` config by `kind` so integrators can avoid custom `DynamicSlotsLayout`/`SlotOutlet`.
- Preserve advanced mode (custom children layout) unchanged.

**Acceptance Criteria:**

- [x] Integrator can render multi-slot workspace in two steps (`ChatView` + `slotRenderers`).
- [x] Existing custom-layout usage still works.

## Task 6: Tests for Controller, Resolvers, and Integration

**File(s) to create/modify:** `src/components/ChatView/__tests__/layoutController.test.ts`, `src/components/ChatView/__tests__/ChatView.test.tsx`, `src/components/ChannelHeader/__tests__/ChannelHeader.test.js`

**Dependencies:** Task 2, Task 3, Task 4, Task 5

**Status:** done

**Owner:** codex

**Scope:**

- Add unit tests for resolver chain and duplicate policies.
- Add controller tests for `open` outcomes and `occupiedAt`.
- Add integration tests for switching from threads view to channel via annotation action path.
- Add header toggle tests for `entityListPaneOpen`.

**Acceptance Criteria:**

- [x] New tests cover resolver defaults and replacement scenarios.
- [x] Tests verify thread/channel switching and entity list pane toggling.
- [ ] No regression in existing ChatView/ChannelHeader tests.

## Task 7: Docs and Spec Alignment

**File(s) to create/modify:** `src/components/ChatView/specs/layoutController/spec.md`, `src/components/ChatView/specs/layoutController/plan.md`

**Dependencies:** Task 5, Task 6

**Status:** pending

**Owner:** unassigned

**Scope:**

- Align final API names/signatures in spec with implementation details.
- Add migration notes and examples for low-level vs high-level API usage.
- Update plan status/ownership after implementation.

**Acceptance Criteria:**

- [ ] Spec reflects implemented API exactly.
- [ ] Examples compile logically against final exported types.

## Execution order

Phase 1 (Parallel):

- Task 1: Core Types and Controller Engine

Phase 2 (After Task 1):

- Task 2: Resolver Registry and Built-in Strategies

Phase 3 (After Tasks 1, 2):

- Task 3: ChatView Integration (Context and Props)

Phase 4 (After Task 3):

- Task 4: Header Toggle Wiring for Entity List Pane
- Task 5: Built-in Two-Step DX Layout API

Phase 5 (After Tasks 2, 3, 4, 5):

- Task 6: Tests for Controller, Resolvers, and Integration

Phase 6 (After Tasks 5, 6):

- Task 7: Docs and Spec Alignment

## File Ownership Summary

| Task | Creates/Modifies                                                                                                                       |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `src/components/ChatView/layoutController/LayoutController.ts`, `src/components/ChatView/layoutController/layoutControllerTypes.ts`    |
| 2    | `layoutSlotResolvers.ts`                                                                                                               |
| 3    | `ChatView.tsx`, `index.tsx`                                                                                                            |
| 4    | `ChannelHeader.tsx`                                                                                                                    |
| 5    | `ChatView.tsx`, `layout/WorkspaceLayout.tsx`                                                                                           |
| 6    | `ChatView/__tests__/layoutController.test.ts`, `ChatView/__tests__/ChatView.test.tsx`, `ChannelHeader/__tests__/ChannelHeader.test.js` |
| 7    | `src/components/ChatView/specs/layoutController/spec.md`, `src/components/ChatView/specs/layoutController/plan.md`                     |
