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

- `src/specs/layout-controller/spec.md`

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

**File(s) to create/modify:** `src/specs/layout-controller/spec.md`, `src/specs/layout-controller/plan.md`

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
| 7    | `src/specs/layout-controller/spec.md`, `src/specs/layout-controller/plan.md`                                                                                                             |
| 8    | `layoutController/LayoutController.ts`, `layoutController/layoutControllerTypes.ts`, `ChannelHeader.tsx`                                                                                 |
| 9    | `layoutController/layoutControllerTypes.ts`, `ChatView.tsx`, `layout/WorkspaceLayout.tsx`, `ChannelHeader.tsx`                                                                           |
| 10   | `ChatView.tsx`, `layout/WorkspaceLayout.tsx`, `layoutController/layoutControllerTypes.ts`                                                                                                |
| 11   | `layout/Slot.tsx`, `ChatView/styling/*`, `layout/WorkspaceLayout.tsx`                                                                                                                    |
| 12   | `layoutController/LayoutController.ts`, `layoutController/layoutControllerTypes.ts`, `layoutController/serialization.ts`                                                                 |
| 13   | `ChatView.tsx`, `ChatViewNavigationContext.tsx`, `index.tsx`, `ChannelHeader.tsx`                                                                                                        |
| 14   | `src/components/Thread/Thread.tsx`                                                                                                                                                       |
| 15   | `ChatView/__tests__/layoutController.test.ts`, `ChatView/__tests__/ChatView.test.tsx`, `ChannelHeader/__tests__/ChannelHeader.test.js`, `ChatView/__tests__/ChatViewNavigation.test.tsx` |
| 16   | `src/components/ChatView/layout/Slot.tsx`, `src/components/ChatView/layout/WorkspaceLayout.tsx`, `src/specs/layout-controller/spec.md`                                                   |

## Task 16: Slot Self-Visibility from Slot Prop

**File(s) to create/modify:** `src/components/ChatView/layout/Slot.tsx`, `src/components/ChatView/layout/WorkspaceLayout.tsx`, `src/specs/layout-controller/spec.md`

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

**File(s) to create/modify:** `src/components/ChatView/layoutController/layoutControllerTypes.ts`, `src/components/ChatView/layoutController/LayoutController.ts`, `src/components/ChatView/ChatViewNavigationContext.tsx`, `src/components/ChatView/ChatView.tsx`, `src/specs/layout-controller/spec.md`

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

| Task | Creates/Modifies                                                                                                                                                                                                                                                            |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 17   | `src/components/ChatView/layoutController/layoutControllerTypes.ts`, `src/components/ChatView/layoutController/LayoutController.ts`, `src/components/ChatView/ChatViewNavigationContext.tsx`, `src/components/ChatView/ChatView.tsx`, `src/specs/layout-controller/spec.md` |

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

**Status:** done

**Owner:** codex

**Scope:**

- Introduce dedicated `StateStore` for `members` in SDK `ChannelState`.
- Keep backward compatibility via existing API surface (getters/setters or equivalent adapter path).
- Ensure existing direct `channel.state.members` consumers continue to function during migration.

**Acceptance Criteria:**

- [x] `members` has a dedicated reactive store in `channel_state.ts`.
- [x] Backward-compatible access path for `members` is preserved.

## Task 20: Add `read` StateStore to ChannelState (SDK)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** Task 19

**Status:** done

**Owner:** codex

**Scope:**

- Introduce dedicated `StateStore` for `read` in SDK `ChannelState`.
- Keep backward compatibility for existing `read` access.
- Validate that read-dependent consumers (receipts/unread logic) keep behavior.

**Acceptance Criteria:**

- [x] `read` has a dedicated reactive store in `channel_state.ts`.
- [x] Backward-compatible access path for `read` is preserved.

## Task 21: Add `watcherCount` StateStore to ChannelState (SDK)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** Task 20

**Status:** done

**Owner:** codex

**Scope:**

- Introduce reactive storage for `watcherCount` as part of a shared watcher store contract.
- Preserve backward-compatible reads/writes for `watcherCount`.
- Ensure watcher count updates remain event-driven and stable.

**Acceptance Criteria:**

- [x] `watcherCount` is managed by dedicated reactive store infrastructure.
- [x] Backward-compatible access path for `watcherCount` is preserved.

## Task 22: Add `watchers` StateStore to ChannelState (SDK)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** Task 21

**Status:** done

**Owner:** codex

**Scope:**

- Add reactive storage for `watchers` in the same store family as `watcherCount`.
- Keep `watchers` backward compatibility via adapter/getter path.
- Confirm watcher list updates stay in sync with watcher count updates.

**Acceptance Criteria:**

- [x] `watchers` is managed by dedicated reactive store infrastructure.
- [x] `watchers` + `watcherCount` updates stay synchronized.

## Task 23: Convert `mutedUsers` to Dedicated StateStore (SDK)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** Task 22

**Status:** done

**Owner:** codex

**Scope:**

- Convert `mutedUsers` in SDK `ChannelState` to dedicated `StateStore`.
- Preserve backward-compatible property behavior.
- Keep existing mute-dependent UI hooks/components functioning unchanged.

**Acceptance Criteria:**

- [x] `mutedUsers` is backed by dedicated reactive store.
- [x] Existing mute access APIs continue working.

## Task 24: Move `typing` Reactive State to TextComposer StateStore (SDK)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageComposer/textComposer.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `src/context/TypingContext.tsx`, `src/components/Channel/hooks/useCreateTypingContext.ts`

**Dependencies:** Task 18

**Status:** done

**Owner:** codex

**Scope:**

- Relocate typing reactive source-of-truth to existing `TextComposer` state store.
- Keep compatibility with current React TypingContext consumption.
- Remove duplicated typing ownership from channel-context-centric paths.
- Keep mirrored typing state on `ChannelState` side (`typingStore`) for backward compatibility, synchronized with TextComposer typing updates.
- Remove TypingContext.tsx from stream-chat-react

**Acceptance Criteria:**

- [x] `typing` source-of-truth is `TextComposer` reactive state.
- [x] Existing typing indicators/context consumers continue to work.

## Task 25: Remove `suppressAutoscroll` from ChannelStateContext and Make It MessageList Props

**File(s) to create/modify:** `src/context/ChannelStateContext.tsx`, `src/components/MessageList/MessageList.tsx`, `src/components/MessageList/VirtualizedMessageList.tsx`, `src/components/Channel/hooks/useCreateChannelStateContext.ts`, `src/components/Channel/Channel.tsx`

**Dependencies:** Task 18

**Status:** done

**Owner:** codex

**Scope:**

- Remove `suppressAutoscroll` from `ChannelStateContextValue`.
- Treat `suppressAutoscroll` as explicit prop input for `MessageList` and `VirtualizedMessageList`.
- Keep channel-level behavior backward compatible through prop defaulting/migration bridge.
- Remove `threadSuppressAutoscroll` from `ChannelStateContextValue`; thread suppression relies on explicit `suppressAutoscroll` props only.

**Acceptance Criteria:**

- [x] `ChannelStateContextValue` no longer includes `suppressAutoscroll` (and `threadSuppressAutoscroll`).
- [x] `MessageList` and `VirtualizedMessageList` support `suppressAutoscroll` via props without regressions.

## Task 26: Integration Layer for Backward Compatibility of New Stores

**File(s) to create/modify:** `src/components/Channel/hooks/useCreateChannelStateContext.ts`, `src/context/ChannelStateContext.tsx`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/client.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageComposer/textComposer.ts`

**Dependencies:** Task 19, Task 20, Task 21, Task 22, Task 23, Task 24, Task 25

**Status:** done

**Owner:** codex

**Scope:**

- Add compatibility bridge layer so migrated stores can be consumed through existing SDK/React interfaces during transition.
- Ensure each moved value (`members`, `read`, `watcherCount`, `watchers`, `mutedUsers`, `typing`) has a stable fallback path.
- Keep `mutedUsers` reactivity on `StreamChat` (`client.mutedUsersStore`) and subscribe directly in React consumers instead of `ChatContext`.
- Keep `pinnedMessages` explicitly out of scope.

**Acceptance Criteria:**

- [x] Compatibility bridge documented and implemented for all moved values.
- [x] No breaking public API removals outside approved scope.

## Task 27: Tests for ChannelStateContext Decomposition and Store Migration

**File(s) to create/modify:** `src/components/MessageList/__tests__/MessageList.test.js`, `src/components/MessageInput/__tests__/*`, `src/components/TypingIndicator/__tests__/*`, `src/components/Channel/__tests__/Channel.test.js`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** Task 26

**Status:** done

**Owner:** codex

**Scope:**

- Add coverage for:
  - channel resolution through `useChannel`,
  - removed `ChannelStateContext` fields,
  - new reactive stores (`members`, `read`, `watcherCount`, `watchers`, `mutedUsers`, `typing`),
  - `suppressAutoscroll` prop behavior in MessageList variants.
- Include compatibility-focused regression checks.

**Acceptance Criteria:**

- [x] React and SDK tests cover all new store migration requirements.
- [x] No regression on thread pagination, unread/read, watchers, typing, mute, and autoscroll behavior.

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

## Task 28: Convert `StreamClient.configs` to Reactive StateStore (SDK)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/client.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** Task 27

**Status:** done

**Owner:** codex

**Scope:**

- Introduce a dedicated `StateStore<{ configs: Configs }>` for `StreamClient.configs` in SDK client.
- Keep backward-compatible property access (`client.configs`) through getter/setter backed by the store.
- Ensure all config writes route through the reactive store path.

**Acceptance Criteria:**

- [x] `StreamClient.configs` is backed by `StateStore<{ configs: Configs }>`.
- [x] Legacy `client.configs` access remains backward compatible.

## Task 29: Convert `channel.data.own_capabilities` to Reactive StateStore (SDK)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** Task 28

**Status:** done

**Owner:** codex

**Scope:**

- Add reactive store for `channel.data.own_capabilities`.
- Keep `channel.data.own_capabilities` compatibility via non-breaking accessor bridge.
- Ensure updates from query/watch/events propagate to this store.

**Acceptance Criteria:**

- [x] `own_capabilities` has a dedicated reactive store path.
- [x] Existing capability reads remain backward compatible.

## Task 30: Remove `channelConfig`/`channelCapabilities` from ChannelStateContext and Subscribe React SDK Stores

**File(s) to create/modify:** `src/components/Channel/hooks/useCreateChannelStateContext.ts`, `src/context/ChannelStateContext.tsx`, `src/components/Message/hooks/useUserRole.ts`, `src/components/MessageActions/hooks/useBaseMessageActionSetFilter.ts`, `src/components/MessageInput/AttachmentSelector/AttachmentSelector.tsx`, `src/components/Poll/PollActions/PollActions.tsx`, `src/components/Poll/PollOptionSelector.tsx`

**Dependencies:** Task 29

**Status:** done

**Owner:** codex

**Scope:**

- Subscribe React SDK to new reactive stores for:
  - client config (`channelConfig` source),
  - own capabilities (`channelCapabilities` source).
- Remove static assumptions so components react to live store updates.
- Remove `channelConfig` and `channelCapabilities` from `ChannelStateContextValue` and migrate consumers to dedicated reactive hooks/selectors.

**Acceptance Criteria:**

- [x] `ChannelStateContextValue` no longer exposes `channelConfig` and `channelCapabilities`.
- [x] React SDK consumers derive config/capabilities from reactive stores via dedicated hooks/selectors.
- [x] Components relying on capabilities/config re-render on store updates.

## Task 31: Compatibility and Regression Tests for Reactive Config/Capabilities

**File(s) to create/modify:** `src/components/Channel/__tests__/Channel.test.js`, `src/components/MessageActions/__tests__/MessageActions.test.js`, `src/components/MessageInput/__tests__/*`, `src/components/Poll/__tests__/*`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** Task 30

**Status:** done

**Owner:** codex

**Scope:**

- Add SDK tests for reactive `client.config` and `own_capabilities`.
- Add React tests for:
  - `channelConfig`-driven behavior via reactive hooks/selectors (not `ChannelStateContext`),
  - `channelCapabilities`-driven behavior via reactive hooks/selectors (not `ChannelStateContext`),
  - absence of `channelConfig`/`channelCapabilities` in `ChannelStateContextValue`.
- Verify no regression in gating logic for actions, attachments, and polls.

**Acceptance Criteria:**

- [x] SDK and React suites cover reactive config/capabilities migration paths.
- [x] Backward-compatible access patterns are verified.
- [x] No regression in config/capability feature gating.

## Execution order update

Phase 20 (After Task 27):

- Task 28: Convert `StreamClient.config` to Reactive StateStore (SDK)

Phase 21 (After Task 28):

- Task 29: Convert `channel.data.own_capabilities` to Reactive StateStore (SDK)

Phase 22 (After Task 29):

- Task 30: Remove `channelConfig`/`channelCapabilities` from ChannelStateContext and Subscribe React SDK Stores

Phase 23 (After Task 30):

- Task 31: Compatibility and Regression Tests for Reactive Config/Capabilities

## File Ownership Summary Update

| Task | Creates/Modifies                                                                                                                                                                                                                                                                                                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 28   | `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/client.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`                                                                                                                                                                     |
| 29   | `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`                                                                                                                                                              |
| 30   | `src/components/Channel/hooks/useCreateChannelStateContext.ts`, `src/context/ChannelStateContext.tsx`, `src/components/Message/hooks/useUserRole.ts`, `src/components/MessageActions/hooks/useBaseMessageActionSetFilter.ts`, `src/components/MessageInput/AttachmentSelector/AttachmentSelector.tsx`, `src/components/Poll/PollActions/PollActions.tsx`, `src/components/Poll/PollOptionSelector.tsx` |
| 31   | `src/components/Channel/__tests__/Channel.test.js`, `src/components/MessageActions/__tests__/MessageActions.test.js`, `src/components/MessageInput/__tests__/*`, `src/components/Poll/__tests__/*`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`                                                                                    |

## Task 32: Attachment-Scoped Media Config Surface

**File(s) to create/modify:** `src/components/Attachment/Attachment.tsx`, `src/components/Attachment/AttachmentContainer.tsx`, `src/components/Attachment/Giphy.tsx`, `src/components/Attachment/LinkPreview/Card.tsx`, `src/components/Attachment/VideoAttachment.tsx`, `src/components/Attachment/*AttachmentContext*` (new)

**Dependencies:** Task 31

**Status:** done

**Owner:** codex

**Scope:**

- Add `giphyVersion`, `imageAttachmentSizeHandler`, `shouldGenerateVideoThumbnail`, and `videoAttachmentSizeHandler` to `AttachmentProps`.
- Add attachment-local propagation (context/provider or equivalent) so attachment descendants read these values from attachment scope.
- Remove attachment descendants' direct reliance on `useChannelStateContext()` for these four values.

**Acceptance Criteria:**

- [x] All four values are provided by `AttachmentProps` and consumed in attachment scope.
- [x] Attachment subtree no longer requires `ChannelStateContext` for these values.
- [x] Existing attachment behavior remains unchanged with default setup.

## Task 33: Remove Channel Ownership for Attachment Media Config

**File(s) to create/modify:** `src/components/Channel/Channel.tsx`, `src/context/ChannelStateContext.tsx`, `src/components/Channel/hooks/useCreateChannelStateContext.ts`

**Dependencies:** Task 32

**Status:** done

**Owner:** codex

**Scope:**

- Remove `giphyVersion`, `imageAttachmentSizeHandler`, `shouldGenerateVideoThumbnail`, and `videoAttachmentSizeHandler` from `ChannelProps`.
- Remove those fields from `ChannelStateContextValue`.
- Remove creation/plumbing of these fields in channel context factories.

**Acceptance Criteria:**

- [x] `ChannelProps` no longer expose the four attachment media config values.
- [x] `ChannelStateContextValue` no longer includes these fields.
- [x] Typecheck passes with attachment-scoped ownership.

## Task 34: Regression and Compatibility Coverage for Attachment-Scoped Config

**File(s) to create/modify:** `src/components/Attachment/__tests__/*`, `src/components/Message/__tests__/*`, `src/components/Channel/__tests__/Channel.test.js`

**Dependencies:** Task 32, Task 33

**Status:** done

**Owner:** codex

**Scope:**

- Add/adjust tests proving attachment rendering still supports giphy version selection, image/video sizing handlers, and video thumbnail generation behavior.
- Add regression coverage that these behaviors work without relying on `ChannelStateContext` fields.
- Validate that `Channel` no longer accepts these props.

**Acceptance Criteria:**

- [x] Test coverage verifies attachment-scoped config behavior.
- [x] Test coverage verifies removed `ChannelProps`/context fields.
- [x] No regressions in attachment rendering behavior.

## Execution order update

Phase 24 (After Task 31):

- Task 32: Attachment-Scoped Media Config Surface

Phase 25 (After Task 32):

- Task 33: Remove Channel Ownership for Attachment Media Config

Phase 26 (After Task 32 and Task 33):

- Task 34: Regression and Compatibility Coverage for Attachment-Scoped Config

## File Ownership Summary Update

| Task | Creates/Modifies                                                                                                                                                                                                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 32   | `src/components/Attachment/Attachment.tsx`, `src/components/Attachment/AttachmentContainer.tsx`, `src/components/Attachment/Giphy.tsx`, `src/components/Attachment/LinkPreview/Card.tsx`, `src/components/Attachment/VideoAttachment.tsx`, `src/components/Attachment/*AttachmentContext*` |
| 33   | `src/components/Channel/Channel.tsx`, `src/context/ChannelStateContext.tsx`, `src/components/Channel/hooks/useCreateChannelStateContext.ts`                                                                                                                                                |
| 34   | `src/components/Attachment/__tests__/*`, `src/components/Message/__tests__/*`, `src/components/Channel/__tests__/Channel.test.js`                                                                                                                                                          |

## Receipt Reactivity Ownership Contract (Tasks 35-39)

Tasks 35-39 must implement and preserve this ownership model:

1. Canonical store: `channel.state.readStore`
2. Derived store: `channel.messageReceiptsTracker` reactive output
3. Consumers only: React receipt hooks/components

Allowed direction only:

- event/query ingestion -> `readStore` patch -> tracker reconcile/emit -> React subscription render

Conflict policy:

- if tracker output diverges from `readStore`, reconciliation must prefer `readStore` and repair tracker state.

## Task 35: Immutable `readStore` Patching for Receipt Updates (SDK Internals)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** Task 34

**Status:** done

**Owner:** codex

**Scope:**

- Replace internal in-place mutation paths for receipt state (`state.read[userId] = ...`) with immutable `readStore.next((current) => ...)` patching.
- Keep `ChannelState.read` compatibility access intact while routing event/query update paths through direct `readStore` patching.
- Ensure bootstrap/query `state.read` ingestion applies incremental immutable merges without unnecessary whole-map overwrite churn.

**Acceptance Criteria:**

- [x] Receipt updates for a single user trigger `readStore` subscriptions.
- [x] Existing `channel.state.read` compatibility behavior is preserved.
- [x] No new public `ChannelState` methods are introduced.
- [x] Receipt updates are canonicalized in `readStore` before any tracker/UI projection updates.

## Task 36: Unify Event-to-Receipt Reconciliation on `readStore` + Tracker (SDK)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** Task 35

**Status:** done

**Owner:** codex

**Scope:**

- Route `message.read`, `notification.mark_unread`, and `message.delivered` through one reconciliation pattern:
  - patch `readStore` immutably for affected user(s),
  - advance `messageReceiptsTracker` in lockstep.
- Keep query/watch initialization aligned with the same reconciliation semantics.

**Acceptance Criteria:**

- [x] All receipt-relevant events update `readStore` and `messageReceiptsTracker` consistently.
- [x] Event ordering does not regress delivered/read invariants.
- [x] One-way sync is enforced: `readStore` (canonical) -> tracker (derived), not the reverse.

## Task 37: Emit Reactive UI Receipt Snapshots from `MessageReceiptsTracker` (SDK)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageDelivery/MessageReceiptsTracker.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageDelivery/index.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** Task 36

**Status:** done

**Owner:** codex

**Scope:**

- Add tracker-owned reactive state for UI consumers (for example `StateStore` with `revision` and/or cached `readersByMessageId` + `deliveredByMessageId` snapshot).
- Emit updates only on effective receipt changes to avoid redundant React work.
- Keep existing query methods (`readersForMessage`, `deliveredForMessage`, etc.) backward compatible.

**Acceptance Criteria:**

- [x] Tracker exposes a reactive surface suitable for React selectors.
- [x] Snapshot/revision updates happen for `ingestInitial`, `onMessageRead`, `onMessageDelivered`, and `onNotificationMarkUnread` when state effectively changes.
- [x] Tracker has a deterministic resync/rebuild path from canonical `readStore`.

## Task 38: Migrate Receipt Hooks to Tracker-Emitted Reactive Data (React)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageDelivery/MessageReceiptsTracker.ts`, `src/components/MessageList/hooks/useLastReadData.ts`, `src/components/MessageList/hooks/useLastDeliveredData.ts`, `src/store/hooks/useStateStore.ts` (if selector-shape support adjustment is needed), `src/components/ChannelPreview/hooks/useMessageDeliveryStatus.ts`

**Dependencies:** Task 37

**Status:** done

**Owner:** codex

**Scope:**

- Route tracker reconciliation from canonical `channel.state.readStore` emissions (subscription-driven), not direct per-event tracker method calls in `Channel` event handlers.
- Add metadata-first delta reconciliation contract for read store emissions (changed/removed user ids), with key-diff fallback when metadata is unavailable.
- Refactor hooks to subscribe to `channel.messageReceiptsTracker` reactive state instead of relying on component tree rerenders or ad hoc event listeners.
- Avoid recomputing full receipt maps in React when tracker can provide emitted/cached receipt snapshots.
- Preserve current behavior for `returnAllReadData` vs last-own-message-only paths.

**Acceptance Criteria:**

- [x] Tracker reconciliation is driven by canonical `readStore` emissions and keeps one-way `readStore -> tracker` ownership.
- [x] Metadata-first delta reconciliation is supported for read updates, with deterministic fallback when metadata is absent.
- [x] `useLastReadData` and `useLastDeliveredData` update reactively on receipt events through tracker state.
- [x] Manual `channel.on('message.delivered', ...)` hook-level synchronization is removed where superseded by tracker store.
- [x] Hook outputs remain API-compatible.
- [x] Hooks do not implement independent receipt truth; they only select from tracker reactive output.

## Task 39: Regression Matrix for Read/Delivery Reactivity

**File(s) to create/modify:** `src/components/MessageList/__tests__/*`, `src/components/Message/__tests__/*`, `src/components/ChannelPreview/__tests__/*`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`

**Dependencies:** Task 38

**Status:** done

**Owner:** codex

**Scope:**

- Add SDK tests for immutable `readStore` patch semantics and tracker reactive snapshot emission.
- Add SDK tests for metadata-driven delta reconciliation and key-diff fallback behavior when metadata is absent.
- Add SDK tests for tracker subscription lifecycle (single subscription, teardown, no post-teardown emissions).
- Add React tests validating updates after `message.read`, `notification.mark_unread`, and `message.delivered`.
- Verify no regressions in message receipt UI paths (message list + preview surfaces).

**Acceptance Criteria:**

- [ ] Event matrix is covered end-to-end across SDK and React layers, including metadata-driven and fallback reconciliation paths.
- [ ] Tracker subscription lifecycle behavior is covered and stable.
- [ ] Read/delivery receipt UI remains functionally consistent with expected behavior.

## Task 40: Add `memberCount` to MembersState with `channel.data.member_count` Compatibility Bridge

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/channel_state.test.js`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/channel.test.js`

**Dependencies:** Task 39

**Status:** done

**Owner:** codex

**Scope:**

- Extend `MembersState` in `channel_state.ts` with `memberCount` so members state shape mirrors watcher state semantics.
- Add/adjust backward-compatible members store accessors so `memberCount` is available through reactive state and legacy access paths.
- Bridge `channel.data.member_count` compatibility in `channel.ts` using the same sync pattern used for own capabilities (`syncOwnCapabilitiesFromChannelData`-style lifecycle sync).
- Ensure SDK-managed channel data replacement paths keep `memberCount` and `channel.data.member_count` synchronized.
- Keep direct `channel.data.member_count` read/write behavior compatible while treating reactive `memberCount` as canonical.
- Add SDK unit coverage for initialization, channel data replacement, direct assignment compatibility, and reactive subscriber updates.

**Acceptance Criteria:**

- [x] `MembersState` includes `memberCount` and exposes it through the intended reactive/compatibility paths.
- [x] `channel.data.member_count` reads remain backward compatible after migration.
- [x] SDK-managed `channel.data` replacement and direct `member_count` assignment both synchronize with canonical `memberCount` state.
- [x] Focused unit tests validate synchronization and backward-compatibility behavior.

## Task 41: Remove `messageIsUnread` from `MessageContextValue` and Resolve Unread via `MessageReceiptsTracker`

**File(s) to create/modify:** `src/context/MessageContext.tsx`, `src/components/Message/Message.tsx`, `src/components/MessageList/utils.ts`, `src/components/Message/__tests__/*`, `src/components/MessageList/__tests__/*`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageDelivery/MessageReceiptsTracker.ts` (API consumption verification only; no SDK behavior changes expected)

**Dependencies:** Task 39

**Status:** done

**Owner:** codex

**Scope:**

- Remove `messageIsUnread` from `MessageContextValue` so message unread status is no longer carried as ad hoc derived context state.
- Refactor message unread checks in React SDK paths to use `channel.messageReceiptsTracker` APIs from `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageDelivery/MessageReceiptsTracker.ts`.
- Keep unread-separator behavior and first-unread detection semantics stable in list rendering.
- Ensure no extra receipt source-of-truth is introduced in React; unread state remains tracker-driven/canonical-store-derived.

**Acceptance Criteria:**

- [x] `MessageContextValue` no longer defines or provides `messageIsUnread`.
- [x] Message unread/delivery UI paths resolve unread state via `MessageReceiptsTracker` API calls/selectors.
- [x] Message list unread separator behavior remains unchanged for end users.
- [x] Updated tests cover unread-state behavior after the context-field removal.

## Task 42: Remove Legacy `MessageProps.openThread` Prop

**File(s) to create/modify:** `src/components/Message/types.ts`, `src/components/Message/Message.tsx`, `src/specs/layout-controller/spec.md`, `src/specs/layout-controller/plan.md`, `src/specs/layout-controller/state.json`, `src/specs/layout-controller/decisions.md`

**Dependencies:** Task 13

**Status:** done

**Owner:** codex

**Scope:**

- Remove leftover `openThread` prop from `MessageProps` because thread-open behavior now belongs to `ChatViewNavigationContext`.
- Remove type plumbing that omits `openThread` in `Message.tsx` now that the prop no longer exists.
- Update spec/plan/state/decisions to capture this cleanup and the canonical navigation contract.

**Acceptance Criteria:**

- [x] `MessageProps` no longer includes `openThread`.
- [x] `Message.tsx` no longer references `openThread` in `MessagePropsToOmit`.
- [x] Spec/plan/state/decisions explicitly record that `useChatViewNavigation()` is the source of truth for thread opening.

## Task 43: Remove `MessageProps.threadList` and Infer Thread Scope in Leaf Components

**File(s) to create/modify:** `src/components/Message/types.ts`, `src/components/Message/Message.tsx`, `src/context/MessageContext.tsx`, `src/components/Message/MessageSimple.tsx`, `src/components/Message/MessageStatus.tsx`, `src/components/Message/MessageAlsoSentInChannelIndicator.tsx`, `src/components/Message/utils.tsx`, `src/components/Message/__tests__/*`, `src/components/MessageList/hooks/MessageList/useMessageListElements.tsx`, `src/components/MessageList/MessageList.tsx`, `src/components/MessageList/VirtualizedMessageList.tsx`, `src/components/MessageList/VirtualizedMessageListComponents.tsx`, `src/components/MessageList/ScrollToLatestMessageButton.tsx`, `src/components/TypingIndicator/TypingIndicator.tsx`, `src/components/Attachment/Audio.tsx`, `src/components/Attachment/LinkPreview/CardAudio.tsx`, `src/components/Attachment/VoiceRecording.tsx`, `src/components/Reactions/ReactionSelectorWithButton.tsx`, `src/components/Thread/Thread.tsx`, `src/components/Thread/ThreadHead.tsx`, `src/components/Attachment/__tests__/Audio.test.js`, `src/components/Attachment/__tests__/Card.test.js`, `src/components/Attachment/__tests__/VoiceRecording.test.js`, `src/components/MessageActions/__tests__/MessageActions.test.js`, `src/components/MessageList/__tests__/MessageList.test.js`, `src/components/MessageList/__tests__/ScrollToLatestMessageButton.test.js`, `src/components/MessageList/__tests__/VirtualizedMessageListComponents.test.js`, `src/components/TypingIndicator/__tests__/TypingIndicator.test.js`, `src/components/Thread/__tests__/Thread.test.js`, `src/specs/layout-controller/spec.md`, `src/specs/layout-controller/plan.md`, `src/specs/layout-controller/state.json`, `src/specs/layout-controller/decisions.md`

**Dependencies:** Task 42

**Status:** done

**Owner:** codex

**Scope:**

- Remove leftover `threadList` from `MessageProps` and related pass-through plumbing in message-level wrappers.
- Update message leaf components that currently branch on `threadList` to infer thread scope directly via `useThreadContext()` instead of context/prop forwarding.
- Keep behavior parity for thread-specific UX branches (reply-button visibility, status rendering, “also sent in channel” behavior/text), but sourced from local thread-instance presence.
- Add/adjust focused tests for leaf behavior in both thread and channel scope without relying on `threadList` prop drilling.

**Acceptance Criteria:**

- [x] `MessageProps` no longer includes `threadList`.
- [x] Message leaf components that require thread awareness infer it via `useThreadContext()` and do not depend on drilled `threadList` props.
- [x] `MessageContextValue` no longer carries `threadList` only for downstream branching.
- [x] Existing thread-vs-channel behavior remains functionally equivalent in updated tests.

## Task 44: Remove `LegacyThreadContext` and Legacy Thread Context Wiring

**File(s) to create/modify:** `src/components/Thread/LegacyThreadContext.ts`, `src/components/Thread/Thread.tsx`, `src/components/Thread/index.ts`, `src/components/Thread/*` consumers still using `useLegacyThreadContext`, `src/specs/layout-controller/spec.md`, `src/specs/layout-controller/plan.md`, `src/specs/layout-controller/state.json`, `src/specs/layout-controller/decisions.md`

**Dependencies:** Task 14

**Status:** pending

**Owner:** unassigned

**Scope:**

- Remove `LegacyThreadContext` provider and hook usage from thread rendering/wiring.
- Remove legacy context exports from `src/components/Thread/index.ts`.
- Update any remaining consumers to use current thread/channel data sources (`useThreadContext`, `useChannel`, or explicit props) without re-introducing context prop drilling.
- Keep runtime behavior equivalent for thread open/close/navigation flows after removing the legacy context layer.

**Acceptance Criteria:**

- [ ] `LegacyThreadContext` is no longer used in thread rendering paths.
- [ ] Thread module no longer exports legacy thread context APIs.
- [ ] TypeScript compiles with no references to `useLegacyThreadContext` in active code.
- [ ] Thread behavior remains stable in updated tests.

## Execution order update

Phase 27 (After Task 34):

- Task 35: Immutable `readStore` Patching for Receipt Updates (SDK Internals)

Phase 28 (After Task 35):

- Task 36: Unify Event-to-Receipt Reconciliation on `readStore` + Tracker (SDK)

Phase 29 (After Task 36):

- Task 37: Emit Reactive UI Receipt Snapshots from `MessageReceiptsTracker` (SDK)

Phase 30 (After Task 37):

- Task 38: Migrate Receipt Hooks to Tracker-Emitted Reactive Data (React)

Phase 31 (After Task 38):

- Task 39: Regression Matrix for Read/Delivery Reactivity

Phase 32 (After Task 39):

- Task 40: Add `memberCount` to MembersState with `channel.data.member_count` Compatibility Bridge

Phase 33 (After Task 39):

- Task 41: Remove `messageIsUnread` from `MessageContextValue` and Resolve Unread via `MessageReceiptsTracker`

Phase 34 (After Task 13):

- Task 42: Remove Legacy `MessageProps.openThread` Prop

Phase 35 (After Task 42):

- Task 43: Remove `MessageProps.threadList` and Infer Thread Scope in Leaf Components

Phase 36 (After Task 14):

- Task 44: Remove `LegacyThreadContext` and Legacy Thread Context Wiring

## File Ownership Summary Update

| Task | Creates/Modifies                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 35   | `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`                                                                                                                                                                                                                                                             |
| 36   | `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`                                                                                                                                                                                                                                                                                                                                                                                       |
| 37   | `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageDelivery/MessageReceiptsTracker.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageDelivery/index.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`                                                                                                                                                                                                                      |
| 38   | `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageDelivery/MessageReceiptsTracker.ts`, `src/components/MessageList/hooks/useLastReadData.ts`, `src/components/MessageList/hooks/useLastDeliveredData.ts`, `src/store/hooks/useStateStore.ts`, `src/components/ChannelPreview/hooks/useMessageDeliveryStatus.ts` |
| 39   | `src/components/MessageList/__tests__/*`, `src/components/Message/__tests__/*`, `src/components/ChannelPreview/__tests__/*`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/*`                                                                                                                                                                                                                                                                                                                                                                              |
| 40   | `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/channel_state.test.js`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/channel.test.js`                                                                                                          |
| 41   | `src/context/MessageContext.tsx`, `src/components/Message/Message.tsx`, `src/components/MessageList/utils.ts`, `src/components/Message/__tests__/*`, `src/components/MessageList/__tests__/*`, `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageDelivery/MessageReceiptsTracker.ts` (API consumption verification only)                                                                                                                                                                                                                                      |
| 42   | `src/components/Message/types.ts`, `src/components/Message/Message.tsx`, `src/specs/layout-controller/spec.md`, `src/specs/layout-controller/plan.md`, `src/specs/layout-controller/state.json`, `src/specs/layout-controller/decisions.md`                                                                                                                                                                                                                                                                                                                                                                               |
| 43   | `src/components/Message/types.ts`, `src/components/Message/Message.tsx`, `src/context/MessageContext.tsx`, `src/components/Message/MessageSimple.tsx`, `src/components/Message/MessageStatus.tsx`, `src/components/Message/MessageAlsoSentInChannelIndicator.tsx`, `src/components/Message/utils.tsx`, `src/components/Message/__tests__/*`, `src/specs/layout-controller/spec.md`, `src/specs/layout-controller/plan.md`, `src/specs/layout-controller/state.json`, `src/specs/layout-controller/decisions.md`                                                                                                           |
| 44   | `src/components/Thread/LegacyThreadContext.ts`, `src/components/Thread/Thread.tsx`, `src/components/Thread/index.ts`, `src/components/Thread/*` consumers still using `useLegacyThreadContext`, `src/specs/layout-controller/spec.md`, `src/specs/layout-controller/plan.md`, `src/specs/layout-controller/state.json`, `src/specs/layout-controller/decisions.md`                                                                                                                                                                                                                                                        |
