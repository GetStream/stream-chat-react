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

**Status:** done

**Owner:** codex

**Scope:**

- Add `channelList` entity kind and treat list panes as regular slots.
- Remove dedicated `entityListPane` state/commands from ChatView layout model.
- Enable replacing `channelList` with alternative entities (e.g. search results) in the same slot.

**Acceptance Criteria:**

- [x] Channel list can be opened/closed/replaced via slot binding APIs.
- [x] No layout code path depends on legacy `entityListPaneOpen`.

## Task 10: Min Slots and Fallback Workspace States

**File(s) to create/modify:** `src/components/ChatView/ChatView.tsx`, `src/components/ChatView/layout/WorkspaceLayout.tsx`, `src/components/ChatView/layoutController/layoutControllerTypes.ts`

**Dependencies:** Task 9

**Status:** done

**Owner:** codex

**Scope:**

- Add `minSlots` support in ChatView layout initialization and rendering.
- Add per-slot fallback rendering for unbound slots (e.g. empty channel workspace prompt).
- Keep `maxSlots` behavior for upper bound slot availability.

**Acceptance Criteria:**

- [x] `minSlots={2}` can render `channelList + empty workspace` before channel selection.
- [x] Fallback content disappears when slot receives entity binding and reappears when cleared.

## Task 11: Generic Slot Component with Mount-Preserving Hide/Unhide

**File(s) to create/modify:** `src/components/ChatView/layout/Slot.tsx` (new), `src/components/ChatView/styling/` (SCSS updates), `src/components/ChatView/layout/WorkspaceLayout.tsx`

**Dependencies:** Task 10

**Status:** done

**Owner:** codex

**Scope:**

- Introduce generic `Slot` component that applies hidden/visible classes at root level.
- Hide slots with CSS while keeping subtree mounted.
- Wire slot visibility state into controller (`hiddenSlots` / `setSlotHidden`).

**Acceptance Criteria:**

- [x] Hidden slots remain mounted (no pagination re-initialization).
- [x] Slot visibility is controllable via layout state and reflected in CSS class contract.

## Task 12: Deep-Linking, Serialization, and openView

**File(s) to create/modify:** `src/components/ChatView/layoutController/LayoutController.ts`, `src/components/ChatView/layoutController/layoutControllerTypes.ts`, `src/components/ChatView/layoutController/serialization.ts` (new)

**Dependencies:** Task 10

**Status:** done

**Owner:** codex

**Scope:**

- Add `openView` command to controller/navigation flow.
- Define serializable layout snapshot format including active view, slot bindings, hidden slots, and parent stacks.
- Add restore helpers that rebind entities safely and skip unresolved keys.

**Acceptance Criteria:**

- [x] View-first deep links (`openView` then entity opens) are supported.
- [x] Layout snapshot round-trip preserves slot stack and visibility semantics.

## Task 13: High-Level Navigation Hook and Context Split

**File(s) to create/modify:** `src/components/ChatView/ChatView.tsx`, `src/components/ChatView/ChatViewNavigationContext.tsx` (new), `src/components/ChatView/index.tsx`, `src/components/ChannelHeader/ChannelHeader.tsx`

**Dependencies:** Task 12

**Status:** done

**Owner:** codex

**Scope:**

- Create `useChatViewNavigation()` with domain actions (`openChannel`, `closeChannel`, `openThread`, `closeThread`, `hideChannelList`, `unhideChannelList`, `openView`).
- Remove high-level domain methods from `LayoutController` API surface.
- Keep low-level `LayoutController` available for advanced/custom workflows.

**Acceptance Criteria:**

- [x] Consumer DX path uses `useChatViewNavigation()` without direct low-level controller usage.
- [x] Existing advanced integrations can still use low-level controller methods (`open`, `bind`, `clear`, etc.).

## Task 14: Thread Component Layout-Controller Adaptation

**File(s) to create/modify:** `src/components/Thread/Thread.tsx`

**Dependencies:** Task 13

**Status:** done

**Owner:** codex

**Scope:**

- Route `Thread.tsx` interaction handlers through `useChatViewNavigation()` (or equivalent ChatView layout API path) instead of legacy thread-only close assumptions.
- On close/back actions, use slot-aware transitions (`closeThread` + controller back-stack behavior) so one-slot mobile flow is deterministic.
- Keep existing Thread component rendering/UI behavior unchanged; adjust only action wiring and navigation interaction points.
- Preserve safe compatibility when Thread is rendered outside ChatView (no hard failure on missing layout navigation context).

**Acceptance Criteria:**

- [x] `Thread.tsx` uses ChatView layout-controller/navigation APIs for thread close/back transitions.
- [x] Thread close/back behavior follows slot-aware controller semantics in one-slot flow.
- [x] Thread UI rendering behavior is unchanged from current behavior.
- [x] Rendering Thread outside ChatView remains safe (no runtime crash/regression).

## Task 15: Tests for Slot Stack, Unified Slots, and Navigation DX

**File(s) to create/modify:** `src/components/ChatView/__tests__/layoutController.test.ts`, `src/components/ChatView/__tests__/ChatView.test.tsx`, `src/components/ChannelHeader/__tests__/ChannelHeader.test.js`, `src/components/ChatView/__tests__/ChatViewNavigation.test.tsx` (new)

**Dependencies:** Task 8, Task 9, Task 10, Task 11, Task 12, Task 13, Task 14

**Status:** done

**Owner:** codex

**Scope:**

- Add tests for per-slot back stack behavior and header icon switching.
- Add tests for `channelList` as slot, min-slot fallback rendering, and mount-preserving hide/unhide.
- Add tests for `openView` and serialization restore flows.
- Add tests for high-level navigation hook behavior and compatibility.

**Acceptance Criteria:**

- [x] One-slot back-stack scenarios are covered.
- [x] Deep-link serialization/deserialization and `openView` are covered.
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

Phase 11 (After Task 13):

- Task 14: Thread Component Layout-Controller Adaptation

Phase 12 (After Tasks 8-14):

- Task 15: Tests for Slot Stack, Unified Slots, and Navigation DX

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
| 14   | `src/components/Thread/Thread.tsx`                                                                                                                                                       |
| 15   | `ChatView/__tests__/layoutController.test.ts`, `ChatView/__tests__/ChatView.test.tsx`, `ChannelHeader/__tests__/ChannelHeader.test.js`, `ChatView/__tests__/ChatViewNavigation.test.tsx` |
| 16   | `src/components/ChatView/layout/Slot.tsx`, `src/components/ChatView/layout/WorkspaceLayout.tsx`, `src/components/ChatView/specs/layoutController/spec.md`                                |

## Task 16: Slot Self-Visibility from Slot Prop

**File(s) to create/modify:** `src/components/ChatView/layout/Slot.tsx`, `src/components/ChatView/layout/WorkspaceLayout.tsx`, `src/components/ChatView/specs/layoutController/spec.md`

**Dependencies:** Task 11

**Status:** done

**Owner:** codex

**Scope:**

- Update `Slot` so hidden/visible state is derived internally from the `slot` prop and layout/controller state.
- Remove requirement for parent components to pass explicit hidden state for slot visibility decisions.
- Keep mount-preserving hide/unhide behavior unchanged.

**Acceptance Criteria:**

- [x] `Slot` visibility can be computed without a parent-provided hidden prop.
- [x] Visibility behavior remains compatible with existing mount-preserving hide/unhide semantics.

## Execution order update

Phase 13 (After Task 11):

- Task 16: Slot Self-Visibility from Slot Prop

## Task 17: Remove Entity Semantics from LayoutController (Slot-Only Controller)

**File(s) to create/modify:** `src/components/ChatView/layoutController/layoutControllerTypes.ts`, `src/components/ChatView/layoutController/LayoutController.ts`, `src/components/ChatView/ChatViewNavigationContext.tsx`, `src/components/ChatView/ChatView.tsx`, `src/components/ChatView/specs/layoutController/spec.md`

**Dependencies:** Task 16

**Status:** done

**Owner:** codex

**Scope:**

- Refactor `LayoutController` to model slot primitives only, without entity-binding-aware semantics.
- Move entity/domain interpretation and mapping to ChatView navigation/composition layers.
- Preserve backward compatibility through a migration path (aliases/shims where feasible) while introducing slot-only low-level contracts.

**Acceptance Criteria:**

- [x] LayoutController low-level API and state no longer depend on entity kinds/domain entities.
- [x] Entity-specific open/close behavior exists only in higher-level ChatView navigation/composition APIs.
- [x] Existing integration paths have documented migration guidance in spec.

## Execution order update

Phase 14 (After Task 16):

- Task 17: Remove Entity Semantics from LayoutController (Slot-Only Controller)

## File Ownership Summary Update

| Task | Creates/Modifies                                                                                                                                                                                                                                                                               |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 17   | `src/components/ChatView/layoutController/layoutControllerTypes.ts`, `src/components/ChatView/layoutController/LayoutController.ts`, `src/components/ChatView/ChatViewNavigationContext.tsx`, `src/components/ChatView/ChatView.tsx`, `src/components/ChatView/specs/layoutController/spec.md` |

## Task 18: Remove Thread Pagination Fields from ChannelStateContextValue

**File(s) to create/modify:** `src/context/ChannelStateContext.tsx`, `src/components/Channel/channelState.ts`, `src/components/Channel/hooks/useCreateChannelStateContext.ts` and other impacted files.

**Dependencies:** Task 17

**Status:** done

**Owner:** codex

**Scope:**

- Remove thread-pagination/thread-message fields from `ChannelState` / `ChannelStateContextValue`:
  - `thread?: LocalMessage | null`
  - `threadHasMore?: boolean`
  - `threadLoadingMore?: boolean`
  - `threadMessages?: LocalMessage[]`
  - `threadSuppressAutoscroll?: boolean`
- Keep thread pagination source-of-truth in `Thread` instance (`ThreadContext` + `Thread.state`), not channel context.
- Preserve compatibility where possible by migrating consumers to thread-instance selectors/hooks.

**Acceptance Criteria:**

- [x] `ChannelStateContextValue` no longer exposes thread pagination fields.
- [x] Thread pagination rendering still works through `ThreadContext`-based state.

## Task 19: Add `members` StateStore to ChannelState (SDK)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** None

**Status:** pending

**Owner:** unassigned

**Scope:**

- Introduce dedicated `StateStore` for `members` in SDK `ChannelState`.
- Keep backward compatibility via existing API surface (getters/setters or equivalent adapter path).
- Ensure existing direct `channel.state.members` consumers continue to function during migration.

**Acceptance Criteria:**

- [ ] `members` has a dedicated reactive store in `channel_state.ts`.
- [ ] Backward-compatible access path for `members` is preserved.

## Task 20: Add `read` StateStore to ChannelState (SDK)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** Task 19

**Status:** pending

**Owner:** unassigned

**Scope:**

- Introduce dedicated `StateStore` for `read` in SDK `ChannelState`.
- Keep backward compatibility for existing `read` access.
- Validate that read-dependent consumers (receipts/unread logic) keep behavior.

**Acceptance Criteria:**

- [ ] `read` has a dedicated reactive store in `channel_state.ts`.
- [ ] Backward-compatible access path for `read` is preserved.

## Task 21: Add `watcherCount` StateStore to ChannelState (SDK)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** Task 20

**Status:** pending

**Owner:** unassigned

**Scope:**

- Introduce reactive storage for `watcherCount` as part of a shared watcher store contract.
- Preserve backward-compatible reads/writes for `watcherCount`.
- Ensure watcher count updates remain event-driven and stable.

**Acceptance Criteria:**

- [ ] `watcherCount` is managed by dedicated reactive store infrastructure.
- [ ] Backward-compatible access path for `watcherCount` is preserved.

## Task 22: Add `watchers` StateStore to ChannelState (SDK)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** Task 21

**Status:** pending

**Owner:** unassigned

**Scope:**

- Add reactive storage for `watchers` in the same store family as `watcherCount`.
- Keep `watchers` backward compatibility via adapter/getter path.
- Confirm watcher list updates stay in sync with watcher count updates.

**Acceptance Criteria:**

- [ ] `watchers` is managed by dedicated reactive store infrastructure.
- [ ] `watchers` + `watcherCount` updates stay synchronized.

## Task 23: Convert `mutedUsers` to Dedicated StateStore (SDK)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** Task 22

**Status:** pending

**Owner:** unassigned

**Scope:**

- Convert `mutedUsers` in SDK `ChannelState` to dedicated `StateStore`.
- Preserve backward-compatible property behavior.
- Keep existing mute-dependent UI hooks/components functioning unchanged.

**Acceptance Criteria:**

- [ ] `mutedUsers` is backed by dedicated reactive store.
- [ ] Existing mute access APIs continue working.

## Task 24: Move `typing` Reactive State to TextComposer StateStore (SDK)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageComposer/textComposer.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `src/context/TypingContext.tsx`, `src/components/Channel/hooks/useCreateTypingContext.ts`

**Dependencies:** Task 18

**Status:** pending

**Owner:** unassigned

**Scope:**

- Relocate typing reactive source-of-truth to existing `TextComposer` state store.
- Keep compatibility with current React TypingContext consumption.
- Remove duplicated typing ownership from channel-context-centric paths.

**Acceptance Criteria:**

- [ ] `typing` source-of-truth is `TextComposer` reactive state.
- [ ] Existing typing indicators/context consumers continue to work.

## Task 25: Remove `suppressAutoscroll` from ChannelStateContext and Make It MessageList Props

**File(s) to create/modify:** `src/context/ChannelStateContext.tsx`, `src/components/MessageList/MessageList.tsx`, `src/components/MessageList/VirtualizedMessageList.tsx`, `src/components/Channel/hooks/useCreateChannelStateContext.ts`, `src/components/Channel/Channel.tsx`

**Dependencies:** Task 18

**Status:** pending

**Owner:** unassigned

**Scope:**

- Remove `suppressAutoscroll` from `ChannelStateContextValue`.
- Treat `suppressAutoscroll` as explicit prop input for `MessageList` and `VirtualizedMessageList`.
- Keep channel-level behavior backward compatible through prop defaulting/migration bridge.

**Acceptance Criteria:**

- [ ] `ChannelStateContextValue` no longer includes `suppressAutoscroll`.
- [ ] `MessageList` and `VirtualizedMessageList` support `suppressAutoscroll` via props without regressions.

## Task 26: Integration Layer for Backward Compatibility of New Stores

**File(s) to create/modify:** `src/components/Channel/hooks/useCreateChannelStateContext.ts`, `src/context/ChannelStateContext.tsx`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageComposer/textComposer.ts`

**Dependencies:** Task 19, Task 20, Task 21, Task 22, Task 23, Task 24, Task 25

**Status:** pending

**Owner:** unassigned

**Scope:**

- Add compatibility bridge layer so migrated stores can be consumed through existing SDK/React interfaces during transition.
- Ensure each moved value (`members`, `read`, `watcherCount`, `watchers`, `mutedUsers`, `typing`) has a stable fallback path.
- Keep `pinnedMessages` explicitly out of scope.

**Acceptance Criteria:**

- [ ] Compatibility bridge documented and implemented for all moved values.
- [ ] No breaking public API removals outside approved scope.

## Task 27: Tests for ChannelStateContext Decomposition and Store Migration

**File(s) to create/modify:** `src/components/MessageList/__tests__/MessageList.test.js`, `src/components/MessageInput/__tests__/*`, `src/components/TypingIndicator/__tests__/*`, `src/components/Channel/__tests__/Channel.test.js`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** Task 26

**Status:** pending

**Owner:** unassigned

**Scope:**

- Add coverage for:
  - channel resolution through `useChannel`,
  - removed `ChannelStateContext` fields,
  - new reactive stores (`members`, `read`, `watcherCount`, `watchers`, `mutedUsers`, `typing`),
  - `suppressAutoscroll` prop behavior in MessageList variants.
- Include compatibility-focused regression checks.

**Acceptance Criteria:**

- [ ] React and SDK tests cover all new store migration requirements.
- [ ] No regression on thread pagination, unread/read, watchers, typing, mute, and autoscroll behavior.

## Execution order update

Phase 15 (After Task 17):

- Task 18: Remove Thread Pagination Fields from ChannelStateContextValue

Phase 16 (Sequential, same-file SDK `channel_state.ts` work):

- Task 19: Add `members` StateStore to ChannelState (SDK)
- Task 20: Add `read` StateStore to ChannelState (SDK)
- Task 21: Add `watcherCount` StateStore to ChannelState (SDK)
- Task 22: Add `watchers` StateStore to ChannelState (SDK)
- Task 23: Convert `mutedUsers` to Dedicated StateStore (SDK)

Phase 17 (After Task 18, parallelizable with Phases 16 where files do not overlap):

- Task 24: Move `typing` Reactive State to TextComposer StateStore (SDK)
- Task 25: Remove `suppressAutoscroll` from ChannelStateContext and Make It MessageList Props

Phase 18 (After Tasks 19-25):

- Task 26: Integration Layer for Backward Compatibility of New Stores

Phase 19 (After Task 26):

- Task 27: Tests for ChannelStateContext Decomposition and Store Migration

## File Ownership Summary Update

| Task | Creates/Modifies                                                                                                                                                                                                                                                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 18   | `src/context/ChannelStateContext.tsx`, `src/components/Channel/channelState.ts`, `src/components/Channel/hooks/useCreateChannelStateContext.ts`                                                                                                                                                                                                                          |
| 19   | `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`                                                                                                                                |
| 20   | `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`                                                                                                                                |
| 21   | `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`                                                                                                                                |
| 22   | `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`                                                                                                                                |
| 23   | `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`                                                                                                                                |
| 24   | `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageComposer/textComposer.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `src/context/TypingContext.tsx`, `src/components/Channel/hooks/useCreateTypingContext.ts`             |
| 25   | `src/context/ChannelStateContext.tsx`, `src/components/MessageList/MessageList.tsx`, `src/components/MessageList/VirtualizedMessageList.tsx`, `src/components/Channel/hooks/useCreateChannelStateContext.ts`, `src/components/Channel/Channel.tsx`                                                                                                                       |
| 26   | `src/components/Channel/hooks/useCreateChannelStateContext.ts`, `src/context/ChannelStateContext.tsx`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageComposer/textComposer.ts` |
| 27   | `src/components/MessageList/__tests__/MessageList.test.js`, `src/components/MessageInput/__tests__/*`, `src/components/TypingIndicator/__tests__/*`, `src/components/Channel/__tests__/Channel.test.js`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`                                                 |
