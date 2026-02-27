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
- Implement commands: `setActiveView`, `setMode`, `bind`, `clear`, `open`, and initial high-level helpers.
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

## Task 4: Header Toggle Wiring

**File(s) to create/modify:** `src/components/ChannelHeader/ChannelHeader.tsx`

**Dependencies:** Task 3

**Status:** done

**Owner:** codex

**Scope:**

- Update header toggle button behavior to call ChatView layout actions by default.
- Keep external override behavior (`onSidebarToggle`) intact.
- Ensure collapsed state derives from ChatView layout state when not controlled.

**Acceptance Criteria:**

- [x] Header toggle hides/shows list area via ChatView state.
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
- Add header toggle tests for list visibility state.

**Acceptance Criteria:**

- [x] New tests cover resolver defaults and replacement scenarios.
- [x] Tests verify thread/channel switching and list visibility toggling.
- [ ] No regression in existing ChatView/ChannelHeader tests.

## Task 7: Docs and Spec Alignment

**File(s) to create/modify:** `src/components/ChatView/specs/layoutController/spec.md`, `src/components/ChatView/specs/layoutController/plan.md`

**Dependencies:** Task 5, Task 6

**Status:** done

**Owner:** codex

**Scope:**

- Align final API names/signatures in spec with implementation details.
- Add migration notes and examples for low-level vs high-level API usage.
- Update plan status/ownership after implementation.

**Acceptance Criteria:**

- [x] Spec reflects implemented API exactly.
- [x] Examples compile logically against final exported types.

## Task 8: Slot Parent Stack and Back Navigation

**File(s) to create/modify:** `src/components/ChatView/layoutController/LayoutController.ts`, `src/components/ChatView/layoutController/layoutControllerTypes.ts`, `src/components/ChannelHeader/ChannelHeader.tsx`

**Dependencies:** Task 3

**Status:** done

**Owner:** codex

**Scope:**

- Add per-slot parent stack (`slotHistory`) to support back navigation within a single slot.
- Add low-level controller commands for stack management (`pushParent`, `popParent`) and back-aware close behavior.
- Update header affordance logic to prefer back arrow when current slot has parents.

**Acceptance Criteria:**

- [x] One-slot flow `channelList -> channel -> thread` can pop back deterministically.
- [x] Header icon/action switches between back and list-toggle semantics using slot history.

## Task 9: Unify ChannelList into Slot Model

**File(s) to create/modify:** `src/components/ChatView/layoutController/layoutControllerTypes.ts`, `src/components/ChatView/ChatView.tsx`, `src/components/ChatView/layout/WorkspaceLayout.tsx`, `src/components/ChannelHeader/ChannelHeader.tsx`

**Dependencies:** Task 8

**Status:** pending

**Owner:** unassigned

**Scope:**

- Add `channelList` entity kind and treat list panes as regular slots.
- Remove dedicated `entityListPane` state/commands from ChatView layout model.
- Enable replacing `channelList` with alternative entities (e.g. search results) in the same slot.

**Acceptance Criteria:**

- [ ] Channel list can be opened/closed/replaced via slot binding APIs.
- [ ] No layout code path depends on legacy `entityListPaneOpen`.

## Task 10: Min Slots and Fallback Workspace States

**File(s) to create/modify:** `src/components/ChatView/ChatView.tsx`, `src/components/ChatView/layout/WorkspaceLayout.tsx`, `src/components/ChatView/layoutController/layoutControllerTypes.ts`

**Dependencies:** Task 9

**Status:** pending

**Owner:** unassigned

**Scope:**

- Add `minSlots` support in ChatView layout initialization and rendering.
- Add per-slot fallback rendering for unbound slots (e.g. empty channel workspace prompt).
- Keep `maxSlots` behavior for upper bound slot availability.

**Acceptance Criteria:**

- [ ] `minSlots={2}` can render `channelList + empty workspace` before channel selection.
- [ ] Fallback content disappears when slot receives entity binding and reappears when cleared.

## Task 11: Generic Slot Component with Mount-Preserving Hide/Unhide

**File(s) to create/modify:** `src/components/ChatView/layout/Slot.tsx` (new), `src/components/ChatView/styling/` (SCSS updates), `src/components/ChatView/layout/WorkspaceLayout.tsx`

**Dependencies:** Task 10

**Status:** pending

**Owner:** unassigned

**Scope:**

- Introduce generic `Slot` component that applies hidden/visible classes at root level.
- Hide slots with CSS while keeping subtree mounted.
- Wire slot visibility state into controller (`hiddenSlots` / `setSlotHidden`).

**Acceptance Criteria:**

- [ ] Hidden slots remain mounted (no pagination re-initialization).
- [ ] Slot visibility is controllable via layout state and reflected in CSS class contract.

## Task 12: Deep-Linking, Serialization, and openView

**File(s) to create/modify:** `src/components/ChatView/layoutController/LayoutController.ts`, `src/components/ChatView/layoutController/layoutControllerTypes.ts`, `src/components/ChatView/layoutController/serialization.ts` (new)

**Dependencies:** Task 10

**Status:** pending

**Owner:** unassigned

**Scope:**

- Add `openView` command to controller/navigation flow.
- Define serializable layout snapshot format including active view, slot bindings, hidden slots, and parent stacks.
- Add restore helpers that rebind entities safely and skip unresolved keys.

**Acceptance Criteria:**

- [ ] View-first deep links (`openView` then entity opens) are supported.
- [ ] Layout snapshot round-trip preserves slot stack and visibility semantics.

## Task 13: High-Level Navigation Hook and Context Split

**File(s) to create/modify:** `src/components/ChatView/ChatView.tsx`, `src/components/ChatView/ChatViewNavigationContext.tsx` (new), `src/components/ChatView/index.tsx`, `src/components/ChannelHeader/ChannelHeader.tsx`

**Dependencies:** Task 12

**Status:** pending

**Owner:** unassigned

**Scope:**

- Create `useChatViewNavigation()` with domain actions (`openChannel`, `closeChannel`, `openThread`, `closeThread`, `hideChannelList`, `unhideChannelList`, `openView`).
- Remove high-level domain methods from `LayoutController` API surface.
- Keep low-level `LayoutController` available for advanced/custom workflows.

**Acceptance Criteria:**

- [ ] Consumer DX path uses `useChatViewNavigation()` without direct low-level controller usage.
- [ ] Existing advanced integrations can still use low-level controller methods (`open`, `bind`, `clear`, etc.).

## Task 14: Tests for Slot Stack, Unified Slots, and Navigation DX

**File(s) to create/modify:** `src/components/ChatView/__tests__/layoutController.test.ts`, `src/components/ChatView/__tests__/ChatView.test.tsx`, `src/components/ChannelHeader/__tests__/ChannelHeader.test.js`, `src/components/ChatView/__tests__/ChatViewNavigation.test.tsx` (new)

**Dependencies:** Task 8, Task 9, Task 10, Task 11, Task 12, Task 13

**Status:** pending

**Owner:** unassigned

**Scope:**

- Add tests for per-slot back stack behavior and header icon switching.
- Add tests for `channelList` as slot, min-slot fallback rendering, and mount-preserving hide/unhide.
- Add tests for `openView` and serialization restore flows.
- Add tests for high-level navigation hook behavior and compatibility.

**Acceptance Criteria:**

- [ ] One-slot back-stack scenarios are covered.
- [ ] Deep-link serialization/deserialization and `openView` are covered.
- [ ] No regression in ChatView/ChannelHeader behavior with new slot model.

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

Phase 7 (After Task 3):

- Task 8: Slot Parent Stack and Back Navigation

Phase 8 (After Task 8):

- Task 9: Unify ChannelList into Slot Model
- Task 10: Min Slots and Fallback Workspace States

Phase 9 (After Task 10):

- Task 11: Generic Slot Component with Mount-Preserving Hide/Unhide
- Task 12: Deep-Linking, Serialization, and openView

Phase 10 (After Task 12):

- Task 13: High-Level Navigation Hook and Context Split

Phase 11 (After Tasks 8-13):

- Task 14: Tests for Slot Stack, Unified Slots, and Navigation DX

## File Ownership Summary

| Task | Creates/Modifies                                                                                                                                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `src/components/ChatView/layoutController/LayoutController.ts`, `src/components/ChatView/layoutController/layoutControllerTypes.ts`                                                      |
| 2    | `layoutSlotResolvers.ts`                                                                                                                                                                 |
| 3    | `ChatView.tsx`, `index.tsx`                                                                                                                                                              |
| 4    | `ChannelHeader.tsx`                                                                                                                                                                      |
| 5    | `ChatView.tsx`, `layout/WorkspaceLayout.tsx`                                                                                                                                             |
| 6    | `ChatView/__tests__/layoutController.test.ts`, `ChatView/__tests__/ChatView.test.tsx`, `ChannelHeader/__tests__/ChannelHeader.test.js`                                                   |
| 7    | `src/components/ChatView/specs/layoutController/spec.md`, `src/components/ChatView/specs/layoutController/plan.md`                                                                       |
| 8    | `layoutController/LayoutController.ts`, `layoutController/layoutControllerTypes.ts`, `ChannelHeader.tsx`                                                                                 |
| 9    | `layoutController/layoutControllerTypes.ts`, `ChatView.tsx`, `layout/WorkspaceLayout.tsx`, `ChannelHeader.tsx`                                                                           |
| 10   | `ChatView.tsx`, `layout/WorkspaceLayout.tsx`, `layoutController/layoutControllerTypes.ts`                                                                                                |
| 11   | `layout/Slot.tsx`, `ChatView/styling/*`, `layout/WorkspaceLayout.tsx`                                                                                                                    |
| 12   | `layoutController/LayoutController.ts`, `layoutController/layoutControllerTypes.ts`, `layoutController/serialization.ts`                                                                 |
| 13   | `ChatView.tsx`, `ChatViewNavigationContext.tsx`, `index.tsx`, `ChannelHeader.tsx`                                                                                                        |
| 14   | `ChatView/__tests__/layoutController.test.ts`, `ChatView/__tests__/ChatView.test.tsx`, `ChannelHeader/__tests__/ChannelHeader.test.js`, `ChatView/__tests__/ChatViewNavigation.test.tsx` |
