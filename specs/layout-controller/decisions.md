# Layout Controller Decisions

## Decision: Use spec.md as the Ralph scope document

**Date:** 2026-02-26  
**Context:**  
Ralph protocol previously referenced `goal.md`, while this project scope is already centered on `spec.md` for implementation requirements.

**Decision:**  
Switch Ralph protocol references from `goal.md` to `spec.md` while keeping the decision log filename as `decisions.md`.

**Reasoning:**  
This keeps collaboration files aligned with the existing ChatView layout workflow and avoids duplicate source-of-truth documents.

**Alternatives considered:**

- Keep `goal.md` in protocol and add another mapping rule — rejected because it adds translation overhead.
- Use `decision.md` singular filename — rejected to preserve existing plural convention.

**Tradeoffs / Consequences:**  
Older plan areas using `goal.md` should be migrated or treated as legacy until updated.

## Decision: Record Task 1 as complete in plan state

**Date:** 2026-02-26  
**Context:**  
Task 1 implementation (`layoutControllerTypes.ts`, `LayoutController.ts`) has been added and typechecked in the worktree.

**Decision:**  
Mark Task 1 as done in `state.json` and assign Task 1 ownership in `plan.md` to Codex.

**Reasoning:**  
This keeps the plan memory synchronized with actual repository state and prevents rework.

**Alternatives considered:**

- Leave task status pending until tests are added — rejected because Task 1 acceptance criteria are scoped to implementation and compilation.
- Mark as in-progress — rejected because implementation and typecheck already completed.

**Tradeoffs / Consequences:**  
Follow-up tasks should treat Task 1 APIs as the baseline and only refine via explicit plan updates.

## Decision: Adopt unified slot navigation model for next implementation phase

**Date:** 2026-02-27  
**Context:**  
New requirements were introduced after the initial controller implementation to support one-slot mobile back navigation, unified slot treatment for channel list/search, min-slot fallbacks, mount-preserving hide/unhide, deep-link restore, and a less intimidating DX API.

**Decision:**  
Evolve the spec and plan with a unified slot model:

- add per-slot parent stacks,
- model `channelList` as an entity slot (no dedicated entity-list-pane state),
- support `minSlots` with fallback content,
- introduce a mount-preserving `Slot` primitive for hide/unhide,
- add `openView` and serializer/restore contract,
- move high-level domain methods (`openChannel`, `openThread`, etc.) into `useChatViewNavigation()` and keep `LayoutController` low-level.

**Reasoning:**  
This design cleanly handles mobile one-slot navigation, avoids divergent list-pane semantics, improves deep-link behavior, and makes common integration paths easier without removing advanced low-level control.

**Alternatives considered:**

- Keep current entity-list-pane as a special layout region and only patch back behavior — rejected because it still blocks list replacement in the same slot and creates split semantics.
- Keep all high-level methods on `LayoutController` — rejected because it keeps DX intimidating and mixes domain-level workflow into low-level layout primitives.

**Tradeoffs / Consequences:**  
The implementation requires a second phase touching controller types, ChatView contexts, ChannelHeader behavior, and tests. Existing APIs remain usable during migration but should converge on the new navigation hook model.

## Decision: Implement resolver composition as pure slot resolvers

**Date:** 2026-02-26  
**Context:**  
Task 2 requires a reusable resolver registry and a default resolver chain for channel-centric layouts.

**Decision:**  
Add `src/components/ChatView/layoutSlotResolvers.ts` with exported pure resolver functions (`requestedSlotResolver`, `firstFree`, `existingThreadSlotForThread`, `existingThreadSlotForChannel`, `earliestOccupied`, `activeOrLast`, `replaceActive`, `replaceLast`, `rejectWhenFull`), plus `composeResolvers`, and define `resolveTargetSlotChannelDefault` as composed chain:
`requestedSlotResolver -> firstFree -> existingThreadSlotForThread -> existingThreadSlotForChannel -> earliestOccupied -> activeOrLast`.

**Reasoning:**  
Pure resolver functions are independently testable and reusable by integrators. Composition preserves deterministic fallback behavior without coupling resolver logic to controller mutation logic.

**Alternatives considered:**

- Implement only one monolithic default resolver — rejected because it reduces reuse and test granularity.
- Keep resolvers private inside `LayoutController` — rejected because Task 2 requires exported, reusable strategies.

**Tradeoffs / Consequences:**  
`replaceActive` and `activeOrLast` currently resolve identically by design; keeping both exported names improves API clarity for different integration intents.

## Decision: Keep activeChatView as a compatibility alias over controller activeView

**Date:** 2026-02-26  
**Context:**  
Task 3 introduces `layoutController` as the source of truth in ChatView context, but existing consumers and selectors read `activeChatView` and call `setActiveChatView`.

**Decision:**  
Expose both `activeView`/`setActiveView` and compatibility aliases `activeChatView`/`setActiveChatView` from `useChatViewContext()`, all mapped to `layoutController.state.activeView` and `layoutController.setActiveView`.

**Reasoning:**  
This keeps existing ChatView usage stable while enabling the new controller-first API without forcing immediate downstream migration.

**Alternatives considered:**

- Remove old names and migrate all call sites at once — rejected because it would be a broad breaking change outside Task 3 scope.

**Tradeoffs / Consequences:**  
Context temporarily carries duplicate field names until follow-up cleanup/migration tasks.

## Decision: Use default channel resolver fallback for internally created controllers

**Date:** 2026-02-26  
**Context:**  
Task 3 requires ChatView to wire a default resolver fallback when `resolveTargetSlot` is absent.

**Decision:**  
When ChatView creates its internal controller, default `resolveTargetSlot` to `resolveTargetSlotChannelDefault`; external `layoutController` instances are left untouched.

**Reasoning:**  
This gives predictable out-of-the-box replacement behavior for the built-in path while respecting externally managed controller policy.

**Alternatives considered:**

- Leave resolver undefined and rely on controller fallback only — rejected because it does not satisfy Task 3 acceptance and weakens default DX.
- Force `maxSlots` and resolver onto external controllers — rejected because external controllers should remain authoritative.

**Tradeoffs / Consequences:**  
Internal and external controller paths may differ by integrator design, which is intentional for flexibility.

## Decision: ChannelHeader toggle now defaults to ChatView layout controller

**Date:** 2026-02-26  
**Context:**  
Task 4 requires ChannelHeader's sidebar toggle to be driven by ChatView layout state, while still allowing external override handlers.

**Decision:**  
Update `ChannelHeader` so the toggle button uses `layoutController.toggleEntityListPane()` by default, add an optional `onSidebarToggle` prop that takes precedence when provided, and derive `sidebarCollapsed` from `!entityListPaneOpen` when `sidebarCollapsed` is not controlled by props.

**Reasoning:**  
This aligns header behavior with the new ChatView layout-controller source of truth and preserves integrator escape hatches for custom sidebar behavior.

**Alternatives considered:**

- Keep using `ChatContext.openMobileNav` as default toggle path — rejected because layout responsibilities are being moved to ChatView.
- Require `sidebarCollapsed` to always be controlled by the parent — rejected because default controller-driven behavior should work out of the box.

**Tradeoffs / Consequences:**  
When `ChannelHeader` is rendered outside a ChatView provider, it falls back to the default ChatView context controller state rather than `openMobileNav`; follow-up integration tests in Task 6 should validate expected host usage patterns.

## Decision: Add opt-in built-in ChatView workspace layout with kind-based slot renderers

**Date:** 2026-02-26  
**Context:**  
Task 5 requires a two-step DX path so integrators can render a nav-rail/entity-list/workspace shell without building custom `DynamicSlotsLayout` and `SlotOutlet` components.

**Decision:**  
Extend `ChatView` with optional `layout='nav-rail-entity-list-workspace'` and `slotRenderers` props. In this mode, `ChatView` renders:

- nav rail (`ChatViewSelector`)
- entity list pane (`ChannelList` when `activeView='channels'`, `ThreadList` when `activeView='threads'`) controlled by `entityListPaneOpen`
- workspace slots from `availableSlots`, where each bound entity is rendered by `slotRenderers[entity.kind]`.

The layout container is implemented in `src/components/ChatView/layout/WorkspaceLayout.tsx`, while existing custom-children behavior remains the default when `layout` is not provided.

**Reasoning:**  
This provides the requested low-friction two-step integration while preserving the advanced/custom layout escape hatch and existing usage patterns.

**Alternatives considered:**

- Replace current `children` composition model entirely — rejected because it would break advanced/custom integrations.
- Hardcode slot rendering for built-in entity kinds — rejected because it would reduce extensibility and conflict with the spec’s renderer-by-kind design.

**Tradeoffs / Consequences:**  
Built-in mode uses default `ChannelList`/`ThreadList` props; deeper pane customization remains available through custom layout mode until dedicated built-in pane configuration is introduced.

## Decision: Add Task 6 coverage across controller, resolver, ChatView integration, and ChannelHeader toggle behavior

**Date:** 2026-02-26  
**Context:**  
Task 6 requires tests for resolver behavior, controller `open` outcomes/`occupiedAt`, thread-to-channel integration flow, and ChannelHeader entity list pane toggling.

**Decision:**  
Add:

- `src/components/ChatView/__tests__/layoutController.test.ts` for controller open statuses (`opened`/`replaced`/`rejected`), `occupiedAt` lifecycle, duplicate policies (`reject`/`move`), and `resolveTargetSlotChannelDefault` replacement fallbacks.
- `src/components/ChatView/__tests__/ChatView.test.tsx` for integration coverage of switching `activeView` from threads to channels while opening a channel, plus built-in workspace mode rendering with `slotRenderers` and custom children mode preservation.
- new ChannelHeader tests in `src/components/ChannelHeader/__tests__/ChannelHeader.test.js` to assert default ChatView-driven entity pane toggle and `onSidebarToggle` precedence.

**Reasoning:**  
This directly maps to Task 6 acceptance criteria while keeping tests in module-local `__tests__` folders and reusing existing repository test patterns.

**Alternatives considered:**

- Add only controller unit tests and defer integration/header coverage — rejected because Task 6 explicitly requires both integration and toggle behavior checks.
- Add integration tests only to story-level/e2e suites — rejected because Task 6 scope is unit/integration tests in component modules.

**Tradeoffs / Consequences:**  
In this local environment, executing Jest is blocked by missing runtime dependency (`@babel/runtime/helpers/interopRequireDefault`) from linked `stream-chat-js`; typecheck passes, and full Jest verification should be rerun once dependency linkage is fixed.

## Decision: Align spec with currently implemented Task 1-6 API surface

**Date:** 2026-02-27  
**Context:**  
`spec.md` had drifted toward planned future tasks (`openView`, slot history, unified `channelList` slot entity, and `useChatViewNavigation`) that are not implemented yet. Task 7 requires spec-to-code alignment and migration guidance based on current exports.

**Decision:**  
Rewrite `spec.md` as an implementation snapshot for completed tasks only:

- document current `LayoutController` contract (`bind`, `clear`, `open`, domain open helpers, `setActiveView`, `setMode`, `setEntityListPaneOpen`, `toggleEntityListPane`),
- document current state shape (`entityListPaneOpen`, `slotBindings`, `slotMeta`, `availableSlots`),
- document current resolver registry and default chain,
- document built-in ChatView layout mode (`layout='nav-rail-entity-list-workspace'` + `slotRenderers`),
- add migration notes and low-level vs high-level usage examples,
- explicitly list deferred/future APIs as non-goals for this iteration.

**Reasoning:**  
Keeping the spec strictly aligned with shipped code avoids false integration assumptions while still preserving roadmap context.

**Alternatives considered:**

- Keep future API proposals inline as if implemented — rejected because it contradicts Task 7 acceptance criteria.
- Remove future references entirely — rejected because briefly flagging non-goals clarifies why some planned items are still pending.

**Tradeoffs / Consequences:**  
Spec consumers now get accurate implementation guidance, while future tasks (8+) remain documented as pending in `plan.md`.

## Decision: Add per-slot parent history and header back-priority behavior in Task 8

**Date:** 2026-02-27  
**Context:**  
Task 8 requires deterministic back navigation inside a slot and header behavior that prefers back when slot history exists.

**Decision:**  
Extend layout controller state with per-slot `slotHistory`, add low-level commands `pushParent`, `popParent`, and `close`, and make `open(...)` push replaced entities onto slot history before rebinding. Update `ChannelHeader` so the leading action uses `close(activeSlot)` (with back icon/label) whenever the active slot has parent history; otherwise it keeps existing list-toggle behavior (`onSidebarToggle` override first, then `toggleEntityListPane`).

**Reasoning:**  
Controller-managed history keeps navigation deterministic and domain-agnostic, while header logic can remain presentation-first and state-driven.

**Alternatives considered:**

- Track history only in ChannelHeader local/UI state — rejected because navigation state must survive outside header lifecycles.
- Add back logic only for threads in header — rejected because Task 8 requires generic per-slot stack behavior.

**Tradeoffs / Consequences:**  
`slotHistory` is optional at the type level for compatibility with existing typed state fixtures, but initialized and maintained by controller internals. Additional slot-model unification (`channelList` as slot entity) is deferred to Task 9.

## Decision: Unify entity-list rendering via channelList slot without introducing a WorkspaceLayout variant prop

**Date:** 2026-02-27  
**Context:**  
Task 9 requires treating channel list as a regular slot entity and removing layout-path dependence on `entityListPaneOpen`. An intermediate proposal added a `variant` flag on `WorkspaceLayout` slots to identify list-pane placement.

**Decision:**  
Do not add a `variant` prop. Instead:

- `ChatView` derives the entity-list pane by finding the slot binding with `kind: 'channelList'`,
- `ChatView` passes that slot as `entityListSlot` to `WorkspaceLayout`,
- remaining slot entries are passed as workspace slots,
- `ChannelHeader` toggles list visibility by binding/clearing `channelList` slot entities (with `onSidebarToggle` override still supported when no back-history action is active).

**Reasoning:**  
Binding kind already provides the semantic signal; adding a second classification prop would duplicate source-of-truth and increase mismatch risk.

**Alternatives considered:**

- Add `variant: 'entity-list' | 'workspace'` on each slot — rejected as redundant metadata.
- Keep dedicated `entityListPaneOpen` rendering gate — rejected because Task 9 requires slot-model unification.

**Tradeoffs / Consequences:**  
Controller legacy fields (`entityListPaneOpen` and related methods) still exist for backward compatibility, but built-in layout paths now derive list visibility from slot bindings rather than that flag.

## Decision: Implement Task 10 min-slot initialization and unbound-slot fallback rendering in ChatView built-in layout

**Date:** 2026-02-27  
**Context:**  
Task 10 requires minimum slot rendering before entity selection and fallback content for unbound slots while preserving `maxSlots` as the upper bound.

**Decision:**  
Add `minSlots` to `ChatViewProps` and initialize internal `availableSlots` count from a clamped value `minSlots..maxSlots`. Add optional `slotFallbackRenderer` prop and default fallback content for unbound workspace slots in built-in layout mode. Extend layout state type with optional `minSlots` and `maxSlots` metadata.

**Reasoning:**  
This guarantees a visible empty workspace pane (e.g., alongside `channelList`) before channel selection, while keeping existing resolver and slot binding behavior intact.

**Alternatives considered:**

- Keep initialization at `maxSlots` only and rely on blank slots — rejected because `minSlots` would have no practical effect.
- Render fallback only via consumer-provided renderer — rejected because acceptance requires out-of-the-box empty workspace behavior.

**Tradeoffs / Consequences:**  
Built-in fallback text is currently a simple default string unless `slotFallbackRenderer` is provided. Additional localization/styling refinements can be layered later without changing slot semantics.

## Decision: Replace function-based fallback API with component-based fallback API supporting per-slot overrides

**Date:** 2026-02-27  
**Context:**  
The initial Task 10 fallback API used `slotFallbackRenderer(props)`, but customization needs are better expressed as mountable React components and per-slot overrides.

**Decision:**  
Change ChatView fallback API to:

- `SlotFallback?: ComponentType<{ slot: string }>` as global fallback component,
- `slotFallbackComponents?: Partial<Record<string, ComponentType<{ slot: string }>>>` for per-slot overrides,
- resolution order: per-slot component -> global component -> SDK default fallback component.

**Reasoning:**  
Component-based API improves composability (hooks/context/local state in fallback UIs) and allows explicit per-slot customization without conditional render logic in userland callback functions.

**Alternatives considered:**

- Keep `slotFallbackRenderer` function — rejected due weaker composability and harder per-slot specialization ergonomics.
- Accept only per-slot components without global default — rejected because a global fallback component remains convenient for common cases.

**Tradeoffs / Consequences:**  
This is an API rename from `slotFallbackRenderer` to `SlotFallback`/`slotFallbackComponents`; consumers using the previous prop must migrate.

## Decision: Implement generic Slot primitive with hidden-state class contract in WorkspaceLayout

**Date:** 2026-02-27  
**Context:**  
Task 11 requires mount-preserving hide/unhide semantics and a consistent slot-level CSS contract for visibility.

**Decision:**  
Add `src/components/ChatView/layout/Slot.tsx` as a generic slot wrapper and migrate `WorkspaceLayout` to render both entity-list and workspace entries through this component. `Slot` exposes:

- root class `str-chat__chat-view__slot`,
- hidden modifier class `str-chat__chat-view__slot--hidden`,
- `hidden` prop (mapped to `aria-hidden` and CSS class) while keeping the subtree mounted.

Add corresponding ChatView SCSS classes for workspace layout shell and slot visibility.

**Reasoning:**  
Centralizing slot visibility behavior in one primitive avoids duplicating hide logic and ensures a stable class contract for future hidden-slot controller state wiring.

**Alternatives considered:**

- Keep raw `section` tags and toggle `hidden` directly in each caller — rejected because visibility contract becomes fragmented.
- Add explicit `--visible` modifier class — rejected as unnecessary; hidden state alone is sufficient and simpler.

**Tradeoffs / Consequences:**  
Current Task 11 implementation uses existing layout visibility inputs (`entityListHidden` / slot `hidden`) and class contract. Dedicated controller APIs for arbitrary hidden slots remain follow-up work.

## Decision: Add openView + snapshot serialization/restore helpers with safe default entity handling

**Date:** 2026-02-27  
**Context:**  
Task 12 requires view-first navigation (`openView`) and layout snapshot round-tripping including slot bindings, hidden slots, and parent history while avoiding unsafe assumptions for non-serializable runtime entities.

**Decision:**  
Update controller and types to include:

- `openView(view, options?)` on `LayoutController`,
- `hiddenSlots` in layout state and `setSlotHidden(slot, hidden)` command,
- typed snapshot model (`ChatViewLayoutSnapshot`) and serializer contracts in `layoutControllerTypes.ts`.

Add `src/components/ChatView/layoutController/serialization.ts` with:

- `serializeLayoutState(...)` / `restoreLayoutState(...)`,
- `serializeLayoutControllerState(...)` / `restoreLayoutControllerState(...)`,
- default serializer/deserializer that only handles plain-data entity kinds (`channelList`, `userList`, `searchResults`) and skips unresolved kinds unless custom serializer/deserializer callbacks are provided.

**Reasoning:**  
This enables deep-link and persistence flows without trying to serialize non-plain runtime objects (e.g., channel/thread instances), while still preserving history/visibility semantics for serializable bindings.

**Alternatives considered:**

- Attempt default serialization for all entity kinds — rejected due unsafe/non-deterministic runtime object encoding.
- Store only active view and drop slot state — rejected because Task 12 explicitly requires preserving stack/visibility semantics.

**Tradeoffs / Consequences:**  
Out-of-the-box round-trip fully preserves serializable entity kinds; channel/thread restoration requires consumer-provided deserialize hooks in the restore options.

## Decision: Add dedicated ChatViewNavigation context/hook for high-level domain actions and route ChannelHeader through it

**Date:** 2026-02-27  
**Context:**  
Task 13 requires a less intimidating DX path for common navigation flows and a context split between low-level layout control and high-level domain actions.

**Decision:**  
Add `ChatViewNavigationContext.tsx` with `useChatViewNavigation()` and a provider mounted inside `ChatView`. The navigation hook exposes:

- `openChannel`, `closeChannel`,
- `openThread`, `closeThread`,
- `hideChannelList`, `unhideChannelList`,
- `openView`.

Update `ChannelHeader` to use `useChatViewNavigation()` for list hide/unhide behavior while keeping back action semantics based on slot history. Export the navigation context/hook via `ChatView/index.tsx`.

**Reasoning:**  
This gives consumers a domain-focused API without forcing direct `LayoutController` command orchestration for common flows, while still preserving low-level controller access for advanced integrations.

**Alternatives considered:**

- Keep all navigation logic in `ChannelHeader` and expose no new hook — rejected because it does not improve consumer DX.
- Replace low-level controller APIs entirely — rejected because advanced workflows still require low-level primitives.

**Tradeoffs / Consequences:**  
Some pre-existing high-level helpers on `LayoutController` remain available for compatibility, but the recommended consumer path is now `useChatViewNavigation()`.

## Decision: Re-scope remaining roadmap by inserting Thread adaptation as Task 14 and renumbering tests to Task 15

**Date:** 2026-02-27  
**Context:**  
After Task 13 completion, remaining work was a broad test task. New priority requires adapting `Thread.tsx` to the layout-controller API before final test stabilization.

**Decision:**  
Update collaboration artifacts to:

- add new **Task 14**: `Thread.tsx` layout-controller adaptation,
- move existing tests task to **Task 15** and add dependency on Task 14,
- update execution phases and file-ownership summary accordingly,
- update `state.json` task keys and `spec.md` remaining-work notes to match new sequencing.

**Reasoning:**  
Thread behavior must align with layout-controller navigation semantics first; test stabilization should run after this integration change to avoid churn.

**Alternatives considered:**

- Keep tests as Task 14 and fold Thread adaptation into tests task — rejected because it mixes implementation and verification scopes.
- Insert Thread adaptation later without renumbering — rejected because user explicitly requested new Task 14 and renumbered tests Task 15.

**Tradeoffs / Consequences:**  
Any automation or scripts referencing old `task-14-tests-*` key should be updated to the new `task-15-tests-*` key.

## Decision: Route Thread close/back action through ChatView navigation API with safe legacy fallback

**Date:** 2026-02-27  
**Context:**  
Task 14 requires adapting `src/components/Thread/Thread.tsx` to layout-controller-based navigation without changing Thread UI behavior or breaking non-ChatView usage.

**Decision:**  
Update `Thread.tsx` to use `useChatViewNavigation()` and route the close handler through `closeThread()` first, then call `threadInstance.deactivate()` as a compatibility fallback.

**Reasoning:**  
`closeThread()` enables slot-aware navigation semantics (including controller back-stack behavior) when Thread is rendered inside ChatView navigation context, while the explicit `deactivate()` keeps legacy behavior intact for non-ChatView contexts.

**Alternatives considered:**

- Replace `deactivate()` entirely with `closeThread()` — rejected because default/no-provider navigation path can be a no-op outside ChatView.
- Keep `deactivate()` only — rejected because it bypasses new layout-controller navigation orchestration.

**Tradeoffs / Consequences:**  
In ChatView contexts, both calls run in sequence; this favors compatibility but may be simplified later once all Thread usage is guaranteed to be navigation-context backed.

## Decision: Complete Task 15 with focused coverage across controller, navigation hook, ChatView layout, and ChannelHeader back behavior

**Date:** 2026-02-27  
**Context:**  
Task 15 requires test coverage for slot back-stack behavior, unified slot model (`channelList` slot + hide/unhide), `openView`, serialization round-trips, and the high-level navigation DX.

**Decision:**  
Add/extend tests in:

- `src/components/ChatView/__tests__/layoutController.test.ts` for `openView` activation and serialization/restore behavior,
- `src/components/ChatView/__tests__/ChatView.test.tsx` for `minSlots` fallback rendering and mount-preserving channel-list hide/unhide behavior,
- `src/components/ChatView/__tests__/ChatViewNavigation.test.tsx` (new) for `useChatViewNavigation()` open/close flows and `channelList` hide/unhide semantics,
- `src/components/ChannelHeader/__tests__/ChannelHeader.test.js` for back-action precedence when slot history exists.

**Reasoning:**  
This keeps tests aligned with the new API split: low-level controller semantics in unit tests, high-level consumer behavior in navigation/layout integration tests, and header wiring checks in component tests.

**Alternatives considered:**

- Cover all new behavior only through end-to-end ChatView integration tests — rejected because failures would be less localized and harder to diagnose.
- Keep navigation behavior tests inside `ChatView.test.tsx` only — rejected to avoid overloading one suite and to keep hook DX tests explicit.

**Tradeoffs / Consequences:**  
Typecheck and ESLint passed for touched files. Local Jest execution is currently blocked in this worktree environment by missing `@babel/runtime` resolution from linked `stream-chat-js` artifacts, so full runtime regression confirmation remains pending environment fix.

## Decision: Require Slot to derive hidden state from slot key and layout state

**Date:** 2026-02-27  
**Context:**  
A new requirement was introduced for the Slot primitive: visibility must be intrinsic to Slot behavior and not delegated to parent-provided hidden flags.

**Decision:**  
Add an explicit spec requirement that `Slot` determines hidden/visible state from its `slot` prop and ChatView layout/controller state.

**Reasoning:**  
This centralizes visibility logic, reduces orchestration coupling in `WorkspaceLayout`, and avoids drift where different parents compute slot visibility differently.

**Alternatives considered:**

- Keep parent-driven `hidden` prop as source of truth — rejected because it duplicates visibility logic outside Slot.
- Hybrid parent + Slot visibility rules — rejected because conflict resolution becomes ambiguous.

**Tradeoffs / Consequences:**  
`Slot` becomes slightly more state-aware, and parent layouts lose some direct control over visibility heuristics. In return, visibility behavior becomes consistent across all usages.

## Decision: Implement Slot-owned visibility derivation by slot key

**Date:** 2026-02-27  
**Context:**  
Task 16 required `Slot` to determine hidden/visible state without parent-provided hidden props.

**Decision:**  
`Slot` now derives hidden state from ChatView layout controller state keyed by its own `slot` prop:

- explicit slot hiding via `hiddenSlots[slot]`, and
- compatibility fallback for the channel list slot when `entityListPaneOpen` is false.

`WorkspaceLayout` no longer passes `hidden`/`entityListHidden` visibility authority to `Slot`.

**Reasoning:**  
This centralizes visibility behavior in one primitive and prevents parent-specific visibility drift.

**Alternatives considered:**

- Keep `hidden` prop as required parent input — rejected because it duplicates logic and violates Task 16.
- Use only `hiddenSlots` and ignore `entityListPaneOpen` — rejected for now to preserve compatibility with existing list-pane controls.

**Tradeoffs / Consequences:**  
`Slot` is now context-aware. Targeted typecheck passes; targeted Jest run is currently blocked in this environment by missing `@babel/runtime/helpers/interopRequireDefault` from linked `stream-chat-js` dist artifacts.

## Decision: Make LayoutController slot-only and remove ChatView entity-list slot concept

**Date:** 2026-02-27  
**Context:**  
Task 17 required removing entity semantics from low-level layout control while keeping high-level domain actions in `ChatViewNavigationContext`. A follow-up clarification required that ChatView should not have a dedicated `entityListSlot` concept.

**Decision:**  
Refactor `LayoutController` state/contracts to generic slot bindings (`payload`) and drop entity-specific controller methods. Keep `openChannel`/`openThread`/related domain methods only in `ChatViewNavigationContext`, where domain entities are mapped to generic slot bindings. Remove dedicated `entityListSlot` handling from `WorkspaceLayout`/`ChatView`; all slots are rendered through a single slot list.

**Reasoning:**  
This preserves a strict separation of concerns: low-level controller manages slot primitives only, while ChatView/navigation own product-domain semantics.

**Alternatives considered:**

- Keep entity-specific methods on `LayoutController` for convenience — rejected because it violates slot-only controller requirements.
- Keep `entityListSlot` as a special ChatView lane — rejected because it preserves an opinionated slot category in ChatView composition.

**Tradeoffs / Consequences:**  
Entity typing now lives in ChatView-level helpers (`createChatViewSlotBinding` / `getChatViewEntityBinding`) rather than controller types. Typecheck passes; runtime Jest verification remains blocked in this environment by missing `@babel/runtime` from linked `stream-chat-js` artifacts.

## Decision: Plan ChannelStateContext decomposition and SDK store migration as explicit sequential tasks

**Date:** 2026-02-28  
**Context:**  
New requirements were added to decompose `ChannelStateContext` responsibilities and move multiple channel fields into dedicated reactive SDK stores, while preserving backward compatibility and keeping thread pagination state in `ThreadContext`/`Thread` state.

**Decision:**  
Update `plan.md`, `state.json`, and `spec.md` with Tasks 18-27 and explicit sequencing:

- remove thread pagination fields from `ChannelStateContextValue`,
- create dedicated SDK stores for `members`, `read`, `watcherCount`, `watchers`, and `mutedUsers`,
- move typing ownership to `TextComposer` state,
- move `suppressAutoscroll` to `MessageList`/`VirtualizedMessageList` props,
- add a dedicated integration-compatibility task and a final regression test task.

`members`, `read`, `watcherCount`, and `watchers` were split into separate tasks as requested, with explicit dependencies because they touch the same SDK file.

**Reasoning:**  
This preserves plan parallelism where possible while respecting make-plans same-file constraints and avoiding conflicting edits in `/src/channel_state.ts`. It also makes compatibility requirements explicit before implementation starts.

**Alternatives considered:**

- One large migration task spanning all fields — rejected because it violates requested granularity and makes ownership/testing unclear.
- Parallel tasks for all SDK fields in `channel_state.ts` — rejected due same-file conflict risk and make-plans guidance.

**Tradeoffs / Consequences:**  
Execution is more sequential for SDK tasks, but coordination risk is lower and progress tracking is clearer. `pinnedMessages` stays explicitly out of scope for this iteration.

## Decision: Plan reactive migration for `channelConfig` and `channelCapabilities` via SDK stores

**Date:** 2026-02-28  
**Context:**  
`channelConfig` and `channelCapabilities` are still sourced through `ChannelStateContext` with non-reactive upstream assumptions (`client.config` and `channel.data.own_capabilities`).

**Decision:**  
Add Tasks 28-31 to plan/spec/state to migrate these values through explicit reactive SDK stores and React subscriptions:

- Task 28: convert `StreamClient.config` in SDK client to `StateStore` with backward-compatible property access.
- Task 29: convert `channel.data.own_capabilities` in SDK channel state to reactive store with compatibility bridge.
- Task 30: subscribe React SDK (`src/`) context derivation and consumers to these stores.
- Task 31: add compatibility/regression tests.

**Reasoning:**  
This aligns config/capability sourcing with the broader reactive-state migration and removes stale-value risk in capability/config-gated UI logic.

**Alternatives considered:**

- Keep deriving from plain properties and refresh via existing events only — rejected due inconsistent reactivity and harder correctness guarantees.
- Migrate React consumers first without SDK store changes — rejected because upstream source would remain non-reactive.

**Tradeoffs / Consequences:**  
Adds SDK work in two same-file hotspots (`client.ts`, `channel_state.ts`) requiring explicit task chaining; however it preserves backward compatibility while enabling reactive subscriptions in React SDK.

## Decision: Complete Task 18 by removing thread pagination/message fields from channel state contexts and shifting consumers to Thread instance state

**Date:** 2026-02-28  
**Context:**  
Task 18 required removing thread pagination/message fields from `ChannelState` / `ChannelStateContextValue` and keeping thread pagination source-of-truth in `ThreadContext` + `Thread.state`.

**Decision:**  
Implement Task 18 with these constraints:

- remove thread pagination/message fields from `ChannelStateContextValue`,
- remove thread pagination/message fields and actions from Channel reducer state,
- remove thread pagination controls from `ChannelActionContext` (`closeThread`, `loadMoreThread`),
- migrate thread-aware consumers to `Thread` instance state selectors (`ThreadStart`, `TypingIndicator`, `ScrollToLatestMessageButton`),
- simplify `Window` by removing thread-driven class toggling.

**Reasoning:**  
This enforces a single source-of-truth for thread state (`Thread.state`) and prevents thread pagination ownership split between Channel reducer/context and Thread instance.

**Alternatives considered:**

- Keep thread pagination fields in Channel reducer as internal-only state — rejected to avoid maintaining duplicate thread state ownership.
- Keep compatibility wrappers for removed `ChannelActionContext` thread actions — rejected because close/open semantics are now owned by ChatView navigation and thread instance behavior.

**Tradeoffs / Consequences:**  
Typecheck passes after migration. Local Jest runtime verification remains partially blocked in this environment by missing `@babel/runtime` from the linked `stream-chat-js` dist artifacts; `Window` test passes, and thread-related JS test syntax was corrected.

## Decision: Implement Task 19 using wrapped `members` StateStore shape with compatibility accessor

**Date:** 2026-02-28  
**Context:**  
Task 19 requires a dedicated reactive store for SDK `ChannelState.members` while preserving existing `channel.state.members` access semantics.

**Decision:**  
In `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`:

- add `membersStore: StateStore<{ members: Record<string, ChannelMemberResponse> }>` as the dedicated members store,
- keep compatibility by exposing `members` as a getter/setter that maps to `membersStore` (`getLatestValue().members` / `next({ members })`).

Add targeted tests in `test/unit/channel_state.test.js` to verify:

- default initialization (`members` + `membersStore`),
- setter compatibility and synchronization with the wrapped store value.

**Reasoning:**  
Using the wrapped shape keeps store structure aligned with project `StateStore` usage expectations while preserving existing property-based API access.

**Alternatives considered:**

- Store `members` directly as `StateStore<Record<string, ChannelMemberResponse>>` — rejected after clarification that store values must use object-property shape.
- Replace `members` property with a differently named API — rejected due backward compatibility requirement.

**Tradeoffs / Consequences:**  
Direct nested mutations on `channel.state.members` remain backward compatible but may not emit store updates until follow-up compatibility integration tasks. Typecheck and targeted `channel_state` unit tests pass for this task.

## Decision: Implement Task 20 with dedicated wrapped `read` StateStore and compatibility accessor

**Date:** 2026-02-28  
**Context:**  
Task 20 requires introducing a dedicated reactive store for `ChannelState.read` while preserving existing property-based access (`channel.state.read`).

**Decision:**  
In `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`:

- add `readStore: StateStore<{ read: ChannelReadStatus }>` as a dedicated store instance,
- keep API compatibility through `read` getter/setter that map to `readStore` (`getLatestValue().read` / `next({ read })`).

Add focused tests in `test/unit/channel_state.test.js` to verify:

- default `read` store initialization,
- getter/setter compatibility and store synchronization.

**Reasoning:**  
This mirrors Task 19’s wrapped store convention and satisfies the requirement that each migrated field uses `StateStore` object-value shape while preserving current consumer call sites.

**Alternatives considered:**

- Keep raw `read` field and defer store migration to Task 26 — rejected because Task 20 explicitly requires the dedicated store now.
- Introduce a renamed API and deprecate `read` property immediately — rejected due backward-compatibility requirement.

**Tradeoffs / Consequences:**  
Nested in-place mutations (e.g., `channel.state.read[userId] = ...`) remain operational but may not emit store-level updates until the planned compatibility integration layer is implemented. Typecheck and targeted `channel_state` tests pass.

## Decision: Implement Task 21 with dedicated wrapped `watcherCount` StateStore and `watcher_count` compatibility access

**Date:** 2026-02-28  
**Context:**  
Task 21 requires reactive store-backed watcher count while preserving backward-compatible access paths for existing `channel.state.watcher_count` consumers.

**Decision:**  
In `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`:

- add `watcherCountStore: StateStore<{ watcher_count: number }>` initialized with `{ watcher_count: 0 }`,
- replace direct `watcher_count` field storage with getter/setter that map to `watcherCountStore`.

Add focused tests in `test/unit/channel_state.test.js` to verify:

- default watcher count store initialization,
- compatibility getter/setter behavior and store synchronization.

**Reasoning:**  
This follows the wrapped-object `StateStore` convention established for Task 19/20 and keeps all current call sites that read/write `channel.state.watcher_count` unchanged.

**Alternatives considered:**

- Rename the public field to `watcherCount` immediately — rejected due compatibility risk.
- Defer store migration until `watchers` migration task — rejected because Task 21 explicitly scopes watcher count store first.

**Tradeoffs / Consequences:**  
Task 21 currently uses a dedicated `watcherCountStore`; Task 22 will align `watchers` with watcher-count store-family requirements and may consolidate store shape. Typecheck and targeted `channel_state` tests pass.

## Decision: Implement Task 22 by consolidating `watchers` and `watcher_count` into shared watcher store

**Date:** 2026-02-28  
**Context:**  
Task 22 requires `watchers` reactive storage in the same store family as `watcherCount`, while preserving compatibility for existing `channel.state.watchers` and `channel.state.watcher_count` access paths.

**Decision:**  
Refactor `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts` to use:

- `watcherStore: StateStore<{ watcher_count: number; watchers: Record<string, UserResponse> }>`

with compatibility accessors:

- `get/set watchers` mapped through `watcherStore.partialNext({ watchers })`,
- `get/set watcher_count` mapped through `watcherStore.partialNext({ watcher_count })`.

This replaces the Task 21 standalone `watcherCountStore` so both values are synchronized in one reactive store payload.

**Reasoning:**  
Using one shared store enforces co-location of watcher list + watcher count state and avoids accidental field resets when either side updates.

**Alternatives considered:**

- Keep separate stores for `watchers` and `watcher_count` — rejected because Task 22 explicitly requires same store family and synchronization.
- Keep legacy plain `watchers` field and store only `watcher_count` — rejected as it would not satisfy Task 22 acceptance criteria.

**Tradeoffs / Consequences:**  
In-place nested mutation patterns (e.g., `channel.state.watchers[userId] = user`) remain behavior-compatible but do not emit store updates by themselves; this is expected and will be addressed by later compatibility-integration tasks. Typecheck and targeted `channel_state` tests pass.

## Decision: Implement Task 23 with dedicated wrapped `mutedUsers` StateStore and compatibility access

**Date:** 2026-02-28  
**Context:**  
Task 23 requires migrating `ChannelState.mutedUsers` to dedicated reactive store infrastructure while preserving existing property-level API compatibility.

**Decision:**  
In `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`:

- add `mutedUsersStore: StateStore<{ mutedUsers: Array<UserResponse> }>` initialized as `{ mutedUsers: [] }`,
- replace direct `mutedUsers` field storage with compatibility getter/setter mapped to the store (`getLatestValue().mutedUsers` / `next({ mutedUsers })`).

Add focused tests in `test/unit/channel_state.test.js` for:

- default muted users store initialization,
- backward-compatible getter/setter behavior and store synchronization.

**Reasoning:**  
This keeps consistency with previous state migrations (`members`, `read`, watcher store family) and introduces reactive store infrastructure without breaking existing read/write call sites.

**Alternatives considered:**

- Keep `mutedUsers` as a plain field until Task 26 — rejected because Task 23 explicitly scopes this migration now.
- Merge `mutedUsers` into watcher store — rejected as unrelated state domain and unnecessary coupling.

**Tradeoffs / Consequences:**  
Like other migrated fields, nested in-place array mutation patterns can bypass store emissions unless reassigned through the setter. Typecheck and targeted `channel_state` tests pass.

## Decision: Implement Task 24 with TextComposer typing reactive path plus mirrored ChannelState typing store for compatibility

**Date:** 2026-02-28  
**Context:**  
Task 24 requires moving typing reactive ownership to `TextComposer` state while keeping existing React typing consumption and preserving compatibility with `channel.state.typing`.

**Decision:**  
Implement a dual-path compatibility model:

- `TextComposerState` now includes a documented `typing` map (`user.id -> latest typing event`) in `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageComposer/middleware/textComposer/types.ts`.
- `TextComposer` exposes `typing` getter/setter and helpers (`setTypingEvent`, `removeTypingEvent`) in `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageComposer/textComposer.ts`.
- `ChannelState` now keeps a dedicated wrapped `typingStore: StateStore<{ typing: Record<string, Event> }>` for backward compatibility and mirrors updates into `TextComposer` typing in `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`.
- Channel event handling writes typing updates through `ChannelState` helpers (`setTypingEvent`/`removeTypingEvent`) in `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel.ts`.
- React `useCreateTypingContext` subscribes to `channel.messageComposer.textComposer.state` typing updates (with fallback support) and Channel reducer-owned typing state was removed from `src/components/Channel/channelState.ts` and `src/components/Channel/Channel.tsx`.

**Reasoning:**  
This moves live reactive typing updates to TextComposer while retaining `ChannelState` compatibility surface needed by existing server/client code paths and incremental migration.

**Alternatives considered:**

- Fully remove typing from `ChannelState` now — rejected due backward-compatibility concerns.
- Keep typing only on `ChannelState` and defer TextComposer migration — rejected because Task 24 explicitly requires TextComposer reactive ownership.

**Tradeoffs / Consequences:**  
The mirrored compatibility store introduces temporary duplication by design; Task 26 remains responsible for finalizing cross-layer compatibility contracts. Verification: JS SDK typecheck passed, targeted `channel_state` tests passed, and React typecheck passed; targeted React Jest suites were blocked in this environment due missing `stream-chat` module resolution for that checkout.

## Decision: Implement Task 25 by removing autoscroll suppression fields from ChannelStateContext and using MessageList props only

**Date:** 2026-02-28  
**Context:**  
Task 25 requires removing `suppressAutoscroll` from `ChannelStateContext` and making autoscroll suppression an explicit `MessageList`/`VirtualizedMessageList` prop concern.

**Decision:**  
Apply the removal and prop-only flow:

- remove `suppressAutoscroll` and `threadSuppressAutoscroll` from React `ChannelState` / `ChannelStateContextValue` (`src/context/ChannelStateContext.tsx`),
- stop passing `suppressAutoscroll` through `useCreateChannelStateContext` (`src/components/Channel/hooks/useCreateChannelStateContext.ts`),
- add explicit `suppressAutoscroll?: boolean` prop on `MessageListProps` and keep suppression behavior in list components via prop/defaulting logic (`src/components/MessageList/MessageList.tsx`, `src/components/MessageList/VirtualizedMessageList.tsx`),
- remove `threadSuppressAutoscroll` reducer state and Thread component forwarding from channel context (`src/components/Channel/channelState.ts`, `src/components/Thread/Thread.tsx`).

**Reasoning:**  
This enforces the intended API boundary: autoscroll suppression is configured by list props, not carried in channel-state context.

**Alternatives considered:**

- Keep `threadSuppressAutoscroll` in context while removing only `suppressAutoscroll` — rejected per requirement to rely on explicit list props only.
- Keep hidden fallback on ChannelStateContext for temporary compatibility — rejected to avoid reintroducing removed context fields.

**Tradeoffs / Consequences:**  
Consumers relying on removed context fields must migrate to explicit list props. React typecheck passes; targeted MessageList Jest suites are blocked in this environment due missing `stream-chat` module resolution in this checkout.

## Decision: Add Tasks 28-31 for reactive `channelConfig`/`channelCapabilities` migration

**Date:** 2026-02-28  
**Context:**  
After Task 27, `channelConfig` and `channelCapabilities` were still sourced through non-reactive paths consumed by `useChannelStateContext`. New requirements mandate reactive sources in JS SDK and React subscriptions while preserving compatibility for existing public access patterns.

**Decision:**  
Extend plan/spec/state with a four-task sequence:

- **Task 28:** migrate `StreamClient.config` to a dedicated `StateStore` in JS SDK (`client.ts`) with backward-compatible property access.
- **Task 29:** migrate `channel.data.own_capabilities` to a dedicated reactive store in JS SDK (`channel_state.ts`) with compatibility bridge.
- **Task 30:** wire React SDK subscriptions so `channelConfig` and `channelCapabilities` consumed via `useChannelStateContext` are derived from reactive stores.
- **Task 31:** add SDK + React compatibility/regression tests for reactive updates and legacy access behavior.

**Reasoning:**  
This preserves layering and minimizes risk:

1. establish stable reactive producers in JS SDK first,
2. migrate React consumers to subscribe to those producers,
3. lock behavior with compatibility/regression tests.

**Alternatives considered:**

- Migrate React first with temporary local reactivity adapters — rejected as it duplicates state logic and risks divergence from JS SDK source-of-truth.
- Remove compatibility shims immediately — rejected due explicit backward-compatibility requirement.

**Tradeoffs / Consequences:**  
The plan introduces temporary dual-path maintenance (legacy access + reactive internals), but this is intentional to avoid breaking existing integrations while enabling live updates for config/capability-dependent UI.

## Decision: `channelConfig` and `channelCapabilities` must be removed from `ChannelStateContextValue`

**Date:** 2026-02-28  
**Context:**  
Follow-up requirement clarifies that these values should not remain exposed via `useChannelStateContext` during the reactive migration.

**Decision:**  
Refine Tasks 30-31 and spec wording so migration outcome is:

- `channelConfig` removed from `ChannelStateContextValue`,
- `channelCapabilities` removed from `ChannelStateContextValue`,
- consumers subscribe through dedicated reactive hooks/selectors backed by SDK state stores.

**Reasoning:**  
This keeps `ChannelStateContext` lean and avoids reintroducing indirect, non-domain context coupling while still preserving component-level behavior.

**Supersedes:**  
Task 30 wording in the prior decision that kept these values under `useChannelStateContext` compatibility.

## Decision: Implement Task 28 with `configsStore` (`StateStore<{ configs: Configs }>`), preserving only `configs` accessor compatibility

**Date:** 2026-03-01  
**Context:**  
Task 28 required migrating Stream client config state to reactive store infrastructure. During implementation review, we clarified that `StreamChat` should not introduce a new `config` accessor because it did not exist previously.

**Decision:**  
In `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/client.ts`:

- add `configsStore: StateStore<{ configs: Configs }>` as the reactive source of truth,
- keep compatibility via `get configs()` / `set configs(...)` backed by `configsStore`,
- update `_addChannelConfig(...)` to write immutably through the `configs` setter so updates flow through the store,
- do not add `config` getter/setter.

Add unit coverage in `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/client.test.js` to verify:

- `configsStore` initialization,
- `configs` getter/setter synchronization,
- `_addChannelConfig(...)` updates when cache is enabled,
- no updates when cache is disabled.

**Reasoning:**  
This keeps the reactive migration aligned with existing public API shape (`configs`) and avoids introducing a new surface that downstream SDKs might incorrectly depend on.

**Alternatives considered:**

- Introduce `config` getter/setter alias alongside `configs` — rejected after clarification that no `config` property should be introduced.
- Keep direct mutable writes (`this.configs[cid] = ...`) — rejected because it bypasses guaranteed store-driven updates.

**Tradeoffs / Consequences:**  
External direct deep mutation of the object returned by `configs` can still bypass explicit setter invocation; internal SDK writes now consistently go through the reactive store path.

## Decision: Implement Task 29 with `ownCapabilitiesStore` bridge on `channel.data`

**Date:** 2026-03-01  
**Context:**  
Task 29 required migrating `channel.data.own_capabilities` to a reactive source while preserving backward-compatible access patterns used by existing SDK paths (`channel.data = ...` and `channel.data.own_capabilities = ...`).

**Decision:**  
In `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`:

- add `ownCapabilitiesStore: StateStore<{ own_capabilities: string[] }>` as a dedicated reactive source,
- install a `ChannelState` bridge that wraps `channel.data` through accessor interception,
- re-apply an accessor bridge for `data.own_capabilities` each time `channel.data` is reassigned,
- keep compatibility for direct `channel.data.own_capabilities` assignments while syncing the store.

Add unit coverage in `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/test/unit/channel_state.test.js` to verify:

- store initialization from initial `channel.data.own_capabilities`,
- synchronization on `channel.data` replacement,
- synchronization on direct `channel.data.own_capabilities` assignment.

Also make `typing` getter/setter null-safe for `new ChannelState()` test paths (`this._channel?.messageComposer`) to preserve existing test behavior.

**Reasoning:**  
This approach keeps `ChannelState` as the authoritative reactive producer while preserving legacy `channel.data` read/write behavior without introducing breaking API changes.

**Alternatives considered:**

- Move bridge logic into `Channel` class — rejected for this phase to keep Task 29 scoped to `channel_state.ts`.
- Rely only on `channel.data` reassignment interception — rejected because existing code and tests also mutate `channel.data.own_capabilities` directly.

**Tradeoffs / Consequences:**  
In-place mutation of the capabilities array itself (for example `push`) is not separately intercepted unless a new array is assigned; this matches existing mutable behavior and keeps the migration non-breaking.

## Decision: Do not override `Channel.data` property for Task 29 capability bridge

**Date:** 2026-03-01  
**Context:**  
Initial Task 29 implementation intercepted `channel.data` via `Object.defineProperty` to auto-sync `own_capabilities`. This was broader than necessary and risked side effects on the full data property behavior.

**Decision:**  
Revise Task 29 implementation to avoid redefining `channel.data` entirely:

- keep `ownCapabilitiesStore` in `ChannelState`,
- expose `syncOwnCapabilitiesFromChannelData(...)` in `ChannelState` to bridge only the `own_capabilities` field on the current data object,
- call `state.syncOwnCapabilitiesFromChannelData(this.data)` after internal SDK assignments to `this.data` / `channel.data` in `channel.ts` (query/watch/update/event flows),
- keep direct `channel.data.own_capabilities = ...` backward-compatible by defining accessor on the current data object only.

**Reasoning:**  
This keeps the migration focused on capabilities reactivity, preserves existing `channel.data` property semantics, and still ensures updates from SDK query/watch/events propagate through the reactive store.

**Tradeoffs / Consequences:**  
External direct replacement of `channel.data` by consumers does not auto-sync unless `syncOwnCapabilitiesFromChannelData(...)` is invoked; SDK-managed data update paths now invoke it explicitly.

## Decision: Implement Task 30 by removing config/capabilities from ChannelStateContext and subscribing directly in consumers

**Date:** 2026-03-01  
**Context:**  
Task 30 required eliminating `channelConfig` and `channelCapabilities` from `ChannelStateContextValue` and migrating selected React consumers to reactive SDK stores.

**Decision:**  
Implement the migration in React SDK by:

- removing `channelConfig` and `channelCapabilities` from `ChannelStateContextValue` and from `useCreateChannelStateContext`,
- adding `useChannelConfig({ cid })` in `/Users/martincupela/Projects/stream/chat/stream-chat-react-worktrees/chatview-layout-controller/src/components/Channel/hooks/useChannelConfig.ts` backed by `client.configsStore` via `useStateStore`,
- updating `Channel.tsx` and selected consumers (`useUserRole`, `useBaseMessageActionSetFilter`, `AttachmentSelector`, `PollActions`, `PollOptionSelector`) to subscribe directly to:
  - `channel.state.ownCapabilitiesStore` for capabilities,
  - `client.configsStore` (through `useChannelConfig`) for channel config.

Capabilities remain arrays and are consumed via `includes(...)` checks; no array-to-object conversion is used.

**Reasoning:**  
This keeps context lean and makes config/capabilities reactive at the component that needs them, matching Task 30 goals and avoiding stale snapshot behavior from context propagation.

**Tradeoffs / Consequences:**  
Some components now hold small local selector declarations for `useStateStore`; Task 31 test updates should lock this behavior and guard against regressions.

## Decision: Move attachment media/giphy config ownership from Channel to Attachment

**Date:** 2026-03-02  
**Context:**  
Current behavior routes attachment-specific rendering controls (`giphyVersion`, `imageAttachmentSizeHandler`, `shouldGenerateVideoThumbnail`, `videoAttachmentSizeHandler`) through `ChannelProps` and `ChannelStateContextValue`, even though runtime consumers are in the attachment rendering subtree.

**Decision:**  
Adopt attachment-scoped ownership:

- remove these four values from `ChannelProps`,
- remove them from `ChannelStateContextValue` and channel-state context creation,
- expose them on `AttachmentProps`,
- propagate them inside attachment tree only (attachment-local context/provider or equivalent).

**Reasoning:**  
These values are attachment rendering concerns, not channel-state concerns. Moving them to attachment scope reduces channel context surface area, improves API clarity, and aligns with `WithComponents` overrides where integrators provide custom `Attachment` implementations.

**Alternatives considered:**

- Keep existing Channel-level props/context fields for backward compatibility — rejected because it preserves misplaced ownership and context coupling.
- Keep values in Channel props but mirror into Attachment props — rejected because it keeps dual ownership and ambiguous source-of-truth.

**Tradeoffs / Consequences:**  
This is a deliberate API break for `ChannelProps` and `ChannelStateContextValue` consumers. Regression coverage is required to ensure attachment behavior remains unchanged after the ownership move.

**Plan impact:**  
Add Task 32 (Attachment surface + propagation), Task 33 (Channel/context removal), and Task 34 (regression coverage).

## Decision: Complete remaining React-side Task 31 migration gap in Poll tests

**Date:** 2026-03-02  
**Context:**  
Task 31 requires React tests to validate config/capability gating through reactive stores/hooks rather than `ChannelStateContext`. Most scoped tests were already migrated, but `src/components/Poll/__tests__/Poll.test.js` still seeded `channelCapabilities` directly through `ChannelStateContext`.

**Decision:**  
Update `Poll.test.js` test setup to create a real channel with `channel.data.own_capabilities` and inject only `channel` (plus non-capability context fields) into `ChannelStateProvider`. Capability toggles in tests are now translated into `own_capabilities` on the channel fixture.

**Reasoning:**  
This aligns Poll test setup with Task 30/31 architecture where capabilities are consumed via reactive channel stores (`useChannelCapabilities`) and not via deprecated context fields.

**Tradeoffs / Consequences:**  
Targeted Jest verification in this workspace is currently blocked by a local dependency linkage issue (`Cannot find module '@babel/runtime/helpers/interopRequireDefault'` from linked `stream-chat-js` build). Task 31 remains in progress pending full suite verification.

## Decision: Stabilize Poll Task 31 tests with local provider/component test harness overrides

**Date:** 2026-03-02  
**Context:**  
After migrating Poll tests away from `ChannelStateContext` capability fields, targeted test execution exposed harness-level failures unrelated to Task 31 assertions: missing `DialogManagerProvider` in Poll test wrappers and a workspace-wide `React is not defined` runtime error in default avatar/icon render paths.

**Decision:**  
For Poll test suites only (`Poll.test.js`, `PollActions.test.js`, `PollOptionList.test.js`):

- wrap rendered trees with `DialogManagerProvider` where poll actions mount modal/dialog hooks,
- provide a lightweight `AvatarStack` override through `ComponentProvider` to avoid dependence on the broken default avatar runtime path.

**Reasoning:**  
These harness adjustments keep Task 31 capability/config regression assertions focused and executable without broadening scope into unrelated runtime regressions in shared UI components.

**Tradeoffs / Consequences:**  
Poll Task 31 test subset now passes locally. Broader Task 31 path execution still fails in this dirty workspace due unrelated preexisting regressions (notably `React is not defined` in shared components and non-Task-31 behavior changes), so Task 31 remains `in_progress` pending clean-tree verification.

## Decision: Close Task 31 as implemented and ignore unrelated failing suites per user instruction

**Date:** 2026-03-02  
**Context:**  
After implementing Task 31 test migration updates, broader path test execution in this dirty worktree still reports failures unrelated to Task 31 scope. The user explicitly requested to proceed with task implementation and ignore those failures.

**Decision:**  
Mark Task 31 as done in plan/state based on implemented scope and targeted migration coverage, without requiring clean execution of unrelated failing suites in this workspace.

**Reasoning:**  
This follows direct user instruction and keeps Ralph status aligned with delivered Task 31 changes.

**Tradeoffs / Consequences:**  
Unrelated suite failures remain in the worktree and should be handled separately from Task 31 completion.

## Decision: Implement Task 32 with attachment-local media config context and Channel fallback

**Date:** 2026-03-02  
**Context:**  
Task 32 requires moving `giphyVersion`, `imageAttachmentSizeHandler`, `shouldGenerateVideoThumbnail`, and `videoAttachmentSizeHandler` to attachment scope and removing attachment descendants' direct dependence on `ChannelStateContext` for these values.

**Decision:**  
Add `AttachmentContext` in `src/components/Attachment/AttachmentContext.tsx` and provide it at the `Attachment` root. Extend `AttachmentProps` with the four values, resolve each value by priority `AttachmentProps -> ChannelStateContext fallback -> SDK defaults`, and switch `AttachmentContainer` (image sizing), `Giphy`, `LinkPreview/Card`, and `VideoAttachment` to consume `useAttachmentContext()`.

**Reasoning:**  
This satisfies attachment-scoped ownership now while preserving backward-compatible behavior for existing call sites that still pass values through Channel wiring.

**Tradeoffs / Consequences:**  
`Attachment` temporarily still reads Channel state for fallback compatibility; Task 33 can safely remove Channel ownership paths after this attachment-level surface is established.

## Decision: Complete Task 33 by removing Channel ownership and ChannelStateContext plumbing for attachment media config

**Date:** 2026-03-02  
**Context:**  
Task 33 requires removing `giphyVersion`, `imageAttachmentSizeHandler`, `shouldGenerateVideoThumbnail`, and `videoAttachmentSizeHandler` from `ChannelProps`, `ChannelStateContextValue`, and channel context creation.

**Decision:**  
Remove these fields from:

- `ChannelProps` and `channelStateContextValue` creation in `Channel.tsx`,
- `ChannelStateContextValue` type in `ChannelStateContext.tsx`,
- `useCreateChannelStateContext` plumbing in `useCreateChannelStateContext.ts`.

Additionally, remove `Attachment`'s fallback reads from `useChannelStateContext` so attachment config ownership is fully attachment-scoped.

**Reasoning:**  
Without removing the `Attachment` fallback, Channel would remain an implicit owner at runtime. Eliminating this fallback completes the ownership move started in Task 32.

**Tradeoffs / Consequences:**  
Integrations that previously configured these values via `Channel` props must now configure them through `Attachment` props/custom attachment components.

## Decision: Complete Task 34 with focused regression tests for attachment-scoped config and Channel context removal

**Date:** 2026-03-02  
**Context:**  
Task 34 requires regression/compatibility coverage proving attachment media config behavior is preserved under the new attachment-scoped ownership and that Channel context no longer exposes removed fields.

**Decision:**  
Add focused tests:

- new `src/components/Attachment/__tests__/AttachmentScopedConfig.test.js` covering:
  - `giphyVersion` propagation through attachment scope,
  - `imageAttachmentSizeHandler` usage from `Attachment` props without Channel context dependency,
  - `shouldGenerateVideoThumbnail` + `videoAttachmentSizeHandler` behavior from `Attachment` props.
- update `src/components/Channel/__tests__/Channel.test.js` with a regression assertion that ChannelStateContext does not expose `giphyVersion`, `imageAttachmentSizeHandler`, `shouldGenerateVideoThumbnail`, or `videoAttachmentSizeHandler`.

**Reasoning:**  
These tests directly verify Task 34 acceptance criteria while avoiding unrelated broad-suite instability in the dirty worktree.

**Tradeoffs / Consequences:**  
Coverage is intentionally focused rather than full-suite broad execution. Targeted tests pass and validate the migrated ownership model.

## Decision: Keep receipt reconciliation internal and move receipt-map emission into MessageReceiptsTracker

**Date:** 2026-03-02  
**Context:**  
Follow-up planning for read/delivery reactivity identified two design choices:

1. add new `ChannelState` helper methods (for example `updateRead`/`setReadForUser`) vs using `readStore` directly in internals, and
2. recompute read/delivery receipt maps in React hooks vs emitting reactive receipt data from the SDK tracker.

**Decision:**  
For tasks 35-39:

- do not add new public `ChannelState` APIs for read updates,
- patch read state directly via `channel.state.readStore.next((current) => ...)` in SDK internals,
- extend `MessageReceiptsTracker` to expose a reactive UI-facing receipt signal/snapshot,
- make React hooks consume tracker-emitted reactive data rather than owning receipt-map recomputation.

**Reasoning:**  
This minimizes public API surface changes, keeps receipt computation centralized in the SDK, avoids duplicated logic across React hooks/components, and makes reactivity deterministic for `message.read`, `notification.mark_unread`, and `message.delivered`.

**Alternatives considered:**

- Introduce new public `ChannelState` methods for per-user read patching — rejected to avoid premature API growth.
- Keep hook-level recomputation and event subscriptions as the primary source — rejected because it duplicates tracker logic and risks drift between UI surfaces.

**Tradeoffs / Consequences:**  
Tracker internals gain additional reactive responsibilities and test burden, but React receipt hooks become thinner selectors with less local event bookkeeping and fewer implicit rerender dependencies.

## Decision: Complete Task 35 with immutable readStore patching and merged initialization updates

**Date:** 2026-03-02  
**Context:**  
Task 35 required eliminating in-place receipt map mutations (`state.read[userId] = ...` / nested unread increments) in favor of immutable canonical updates through `channel.state.readStore`, while preserving `channel.state.read` compatibility and avoiding new `ChannelState` public APIs.

**Decision:**  
Implement internal `Channel` helpers to patch and merge read state through `readStore.next((current) => ...)`, then migrate receipt mutation paths in `channel.ts`:

- `message.read`, `message.delivered`, and `notification.mark_unread` now upsert user read state via immutable `readStore` patches,
- `message.new` unread/read receipt adjustments now rebuild affected user entries immutably,
- `_initializeState` now accumulates bootstrap/query read entries and applies one merge patch (`_mergeReadStates`) instead of in-place field writes.

Also add focused tests in `test/unit/channel.test.js` for:

- single-user `message.read` triggering `readStore` subscriptions,
- `_initializeState` read merge behavior preserving existing users while applying incoming read entries.

**Reasoning:**  
This keeps receipt ownership canonical at `readStore`, preserves backward compatibility through `ChannelState.read` accessors, and establishes immutable update semantics needed for subsequent Tasks 36-39.

**Tradeoffs / Consequences:**  
`Channel` now owns small internal read patch helpers, which adds minor internal complexity, but prevents silent mutable updates and keeps the public API unchanged.

## Decision: Complete Task 36 with unified receipt reconciliation helpers driven by canonical readStore

**Date:** 2026-03-02  
**Context:**  
Task 36 required routing `message.read`, `message.delivered`, and `notification.mark_unread` through a single reconciliation pattern that updates canonical `readStore` first and advances `messageReceiptsTracker` as a derived projection, while keeping query/watch initialization aligned with the same semantics.

**Decision:**  
Introduce shared internal reconciliation helpers in `src/channel.ts`:

- `_reconcileMessageRead(...)`
- `_reconcileMessageDelivered(...)`
- `_reconcileNotificationMarkUnread(...)`
- supporting helpers `_upsertReadState(...)` and `_toReadResponses(...)`

and use them in `_handleChannelEvent` for all receipt-relevant events.

Initialization alignment change:

- `_initializeState` now merges read entries into canonical store first, then calls `messageReceiptsTracker.ingestInitial(...)` from canonical `this.state.read` (via `_toReadResponses`) instead of raw response payload.

Ordering/invariant behavior:

- canonical read updates keep receipt progression monotonic for delivery events (no backward delivery regression on out-of-order events),
- tracker calls now use canonical post-patch read state values (one-way canonical -> derived).

**Reasoning:**  
This removes divergent per-event reconciliation code paths, keeps event/query semantics aligned, and enforces the ownership contract where `readStore` is source-of-truth and tracker is derived.

**Tradeoffs / Consequences:**  
`Channel` gained additional internal helper methods, but receipt logic is now centralized and easier to extend in Task 37 without introducing parallel truth sources.

## Decision: Complete Task 37 by adding tracker-owned reactive receipt snapshots with revisioned state

**Date:** 2026-03-02  
**Context:**  
Task 37 required exposing a tracker reactive surface for UI selectors, emitting updates only on effective receipt changes, and preserving deterministic rebuild behavior from canonical read data.

**Decision:**  
Extend `MessageReceiptsTracker` with a tracker-owned reactive store:

- new `snapshotStore: StateStore<MessageReceiptsSnapshot>` where snapshot contains:
  - `revision`
  - `readersByMessageId`
  - `deliveredByMessageId`
- add internal `emitSnapshotIfChanged()` that recomputes grouped maps and increments revision only when effective grouped output changes,
- trigger snapshot emission from `ingestInitial`, `onMessageRead`, `onMessageDelivered`, and `onNotificationMarkUnread` only after effective state mutations,
- add explicit deterministic rebuild API `resyncFromReadResponses(...)` delegating to `ingestInitial(...)`.

Also add focused tests in `test/unit/messageDelivery/MessageReceiptsTracker.test.ts` to verify:

- reactive revision emits on effective changes and not on no-op replays,
- operation coverage for `ingestInitial`, `onMessageRead`, `onMessageDelivered`, and `onNotificationMarkUnread`.

**Reasoning:**  
This keeps reactive receipt projection inside the tracker (single derived source), minimizes unnecessary React work via no-op suppression, and gives Task 38 a stable selector-friendly surface.

**Tradeoffs / Consequences:**  
Tracker now computes grouped snapshots after effective updates (extra internal work), but removes duplicated projection logic from future UI layers.

## Decision: Simplify Channel receipt reconciliation helper surface while keeping canonical ownership

**Date:** 2026-03-02  
**Context:**  
After Task 36 implementation, `Channel` accumulated multiple receipt-specific helpers (`_mergeReadStates`, `_toReadResponses`, `_reconcileMessageRead`, `_reconcileMessageDelivered`, `_reconcileNotificationMarkUnread`) that improved reuse but increased indirection and local complexity.

**Decision:**  
Reduce helper surface in `Channel` to core canonical update primitives:

- keep `_patchReadState(...)` and `_upsertReadState(...)`,
- inline event-specific reconciliation logic in event handlers and initialization flow,
- preserve behavior and one-way ownership (`readStore` canonical, tracker derived).

**Reasoning:**  
This keeps reconciliation logic close to event context, improves readability, and retains the architectural guarantees introduced in Tasks 35-37.

**Tradeoffs / Consequences:**  
Some event handlers now contain more local logic, but the total mental model is smaller because fewer cross-jumping private helper methods are involved.

## Decision: Adopt readStore-emission-driven tracker reconciliation with metadata-first delta and fallback

**Date:** 2026-03-02  
**Context:**  
Current flow still invokes tracker reconciliation methods directly from `Channel` event handlers. For larger channels, repeatedly deriving changes by scanning full read maps is avoidable overhead, and direct calls duplicate event-path coupling.

**Decision:**  
For Task 38/39 implementation direction:

- move tracker reconciliation to a subscription-driven pipeline from canonical `channel.state.readStore` emissions,
- allow readStore emissions to include optional update metadata payload (changed/removed user ids) to avoid full key-diff on every update,
- implement deterministic fallback key-diff reconcile when metadata is absent,
- keep `readStore` as the only canonical source and tracker as derived projection.

**Reasoning:**  
This strengthens one-way ownership, reduces duplicated event-coupled reconciliation logic, and scales reconciliation cost with changed users rather than total channel participants when metadata is present.

**Tradeoffs / Consequences:**  
Requires careful lifecycle management (single subscription + teardown) and explicit compatibility handling for emitters that do not provide metadata; tests must cover metadata and fallback paths.

## Decision: Complete Task 38 with readStore-subscription-driven tracker reconcile and snapshot-driven React hooks

**Date:** 2026-03-02  
**Context:**  
Task 38 required moving receipt consumers to tracker reactive output and reducing direct event-coupled reconciliation paths. We also agreed on performance-oriented reconciliation with metadata-first deltas and canonical fallback behavior.

**Decision:**  
Implement the following:

- `Channel` now wires `messageReceiptsTracker.reconcileFromReadStore(...)` to `state.readStore` subscription and no longer calls tracker receipt handlers directly from `message.read`, `message.delivered`, and `notification.mark_unread` handlers.
- Add optional reconcile metadata flow (`changedUserIds` / `removedUserIds`) from channel read patches for metadata-first delta processing.
- Add deterministic fallback in tracker: when reconcile metadata is missing, rebuild from canonical readStore snapshot.
- Add `_disconnect()` teardown for the receipt reconcile subscription.
- Migrate React receipt hooks to tracker `snapshotStore` subscriptions:
  - `useLastReadData`
  - `useLastDeliveredData`
  - `useMessageDeliveryStatus`
    removing manual `channel.on('message.delivered'...)` and read/delivered event synchronization in those hooks.

**Reasoning:**  
This enforces one-way canonical ownership (`readStore -> tracker -> React`), removes duplicated event-coupled reconciliation logic, and makes hook reactivity depend on tracker-emitted state instead of ad hoc event listeners.

**Tradeoffs / Consequences:**  
Tracker reconciliation internals are more sophisticated (metadata delta + fallback path), and lifecycle correctness now depends on maintaining the readStore subscription contract and teardown behavior.

## Decision: Queue `MembersState.memberCount` migration as Task 40 with `channel.data.member_count` compatibility bridge

**Date:** 2026-03-03  
**Context:**  
A follow-up requirement was added to make members state analogous to watcher state by introducing `memberCount` on `MembersState`, while preserving legacy integration reads/writes through `channel.data.member_count`.

**Decision:**  
Capture this as a new pending Task 40 in `plan.md` with dependency on Task 39, and extend `spec.md` to require:

- `MembersState.memberCount` in `channel_state.ts`,
- a backward-compatible `channel.data.member_count` bridge in `channel.ts`,
- synchronization in SDK-managed channel-data assignment/replacement flows using the same lifecycle pattern already used for own capabilities sync (`syncOwnCapabilitiesFromChannelData` style).

Update `state.json` with a pending task key for Task 40.

**Reasoning:**  
This keeps the Ralph files aligned and implementation-ready without introducing immediate code changes in the SDK worktree. The dependency on Task 39 avoids same-file overlap in `test/unit/*` when work is executed.

**Tradeoffs / Consequences:**  
The requirement is now explicitly planned but unimplemented; behavior remains unchanged until Task 40 is picked up.

## Decision: Implement Task 40 with `MembersState.memberCount` canonical store and `channel.data.member_count` accessor bridge

**Date:** 2026-03-03  
**Context:**  
Task 40 required adding `memberCount` to `MembersState` and preserving compatibility for direct `channel.data.member_count` reads/writes, analogous to the own-capabilities bridge pattern.

**Decision:**  
Implement Task 40 in SDK worktree by:

- extending `MembersState` with `memberCount`,
- adding `ChannelState.member_count` getter/setter and `syncMemberCountFromChannelData(...)`,
- bridging `channel.data.member_count` with an accessor that updates the canonical members store,
- wiring all SDK-managed `channel.data` replacement/update paths in `channel.ts` through `_syncStateFromChannelData(...)` (capabilities + member count),
- preserving `member_count` on `channel.updated` fallback merges and fixing member event math for `0` counts.

Add focused tests in `test/unit/channel_state.test.js` and `test/unit/channel.test.js` covering initialization, replacement sync, direct assignment sync, and event-driven updates.

**Reasoning:**  
This keeps reactive state canonical in `ChannelState` while maintaining backward-compatible `channel.data.member_count` access semantics used by existing integrations.

**Tradeoffs / Consequences:**  
`channel.data.member_count` is now accessor-backed when synchronized, mirroring the existing own-capabilities bridge model; behavior remains semver-compatible for reads/writes while enabling reactive subscriptions.

## Decision: Implement Task 41 by removing `messageIsUnread` context field and switching unread-separator detection to tracker APIs

**Date:** 2026-03-03  
**Context:**  
Task 41 required removing `messageIsUnread` from `MessageContextValue` and retrieving unread state through `MessageReceiptsTracker` APIs instead of ad hoc context-level derivation.

**Decision:**  
Implement Task 41 in React SDK by:

- removing `messageIsUnread` from `MessageContextValue`/provider payload,
- extending `getIsFirstUnreadMessage(...)` with optional tracker-driven `isMessageUnread` callback,
- wiring both non-virtualized (`renderMessages.tsx`) and virtualized (`VirtualizedMessageList.tsx` + `VirtualizedMessageListComponents.tsx`) unread separator checks to `channel.messageReceiptsTracker.hasUserRead(...)`,
- adding focused tests for context field removal and tracker-driven unread utility behavior.

**Reasoning:**  
Unread projection should remain tracker-driven and derived from canonical receipt state rather than duplicated per-message context state. This keeps ownership aligned with Tasks 35-38 receipt architecture.

**Tradeoffs / Consequences:**  
Jest execution in this workspace is currently blocked by missing `@babel/runtime` in linked `stream-chat-js` dist, so test updates were added but could not be executed end-to-end locally.

## Decision: Remove legacy `MessageProps.openThread` in favor of ChatView navigation context

**Date:** 2026-03-03  
**Context:**  
Thread opening was moved to `ChatViewNavigationContext`, but `src/components/Message/types.ts` still exposed legacy `openThread` on `MessageProps`, leaving an outdated API surface that no longer matches implementation ownership.

**Decision:**  
Add Task 42 and remove `openThread` from `MessageProps`, remove corresponding omit-plumbing in `Message.tsx`, and update spec/plan/state to document `useChatViewNavigation().openThread(...)` as the canonical thread-open path.

**Reasoning:**  
Keeping the legacy prop creates ambiguity and invites dead integrations. Removing it aligns public typing with actual navigation architecture introduced in Task 13.

**Tradeoffs / Consequences:**  
This is a type-level cleanup for a stale prop; consumers still relying on that prop will need to migrate to `useChatViewNavigation()` for thread opening.

## Decision: Plan removal of `MessageProps.threadList` with local thread-scope inference in leaf components

**Date:** 2026-03-03  
**Context:**  
`threadList` is still carried through `MessageProps` and message context plumbing, even though thread scope can now be derived from `useThreadContext()`. This creates avoidable prop drilling and keeps message leaf components coupled to upstream forwarding.

**Decision:**  
Add Task 43 as a pending follow-up to remove `threadList` from `MessageProps` and move thread-scope branching to leaf components via `useThreadContext()` presence checks (thread instance present => thread scope). Scope includes message-level plumbing cleanup and focused behavior-preservation tests.

**Reasoning:**  
Thread scope is contextual runtime information and should be read at the point of use. Local inference removes stale prop pathways and keeps ownership aligned with current thread architecture.

**Tradeoffs / Consequences:**  
Leaf components will gain direct thread-context dependencies, but message wrappers become simpler and less coupled. Tests must explicitly cover both thread and non-thread rendering paths to guard against behavior drift.

## Decision: Implement Task 43 by removing `threadList` prop drilling and inferring thread scope from `useThreadContext`

**Date:** 2026-03-03  
**Context:**  
Task 43 required eliminating `MessageProps.threadList` and replacing message-level thread-scope prop drilling with local inference in leaf components.

**Decision:**  
Implement Task 43 in React SDK by:

- removing `threadList` from `MessageProps` and from `MessageContextValue`,
- removing `threadList` forwarding in `Message.tsx`, `MessageList` shared message props plumbing, and virtualized message renderer props to `<Message />`,
- updating leaf message components to infer thread scope via `useThreadContext()`:
  - `MessageSimple` reply-count button visibility,
  - `MessageStatus` read/delivered/sent status branching,
  - `MessageAlsoSentInChannelIndicator` label/action behavior,
- applying the same local thread inference in other leaf consumers that previously depended on `threadList` from message context:
  - `Attachment/Audio`,
  - `Attachment/LinkPreview/CardAudio`,
  - `Attachment/VoiceRecording`,
  - `Reactions/ReactionSelectorWithButton`,
  - `Thread/ThreadHead` (remove `threadList` prop forwarding to `Message`),
- updating message tests that previously used `threadList: true` to provide thread scope via `ThreadProvider`.

**Reasoning:**  
Thread scope is contextual runtime state and should be read where behavior diverges. This removes stale prop pathways and reduces wrapper-level coupling without changing thread-vs-channel UX semantics.

**Tradeoffs / Consequences:**  
Some leaf components now depend directly on thread context. Typecheck passes; local Jest execution remains blocked in this workspace by missing `@babel/runtime` in linked `stream-chat-js` dist artifacts.

## Decision: Add Task 44 to remove `LegacyThreadContext` now that Thread renders outside Channel

**Date:** 2026-03-03  
**Context:**  
`LegacyThreadContext` was kept for older thread wiring assumptions, but `Thread.tsx` now renders outside `Channel.tsx`, so the legacy context layer is redundant and increases maintenance surface.

**Decision:**  
Add Task 44 as a pending follow-up to remove `LegacyThreadContext` provider/hook wiring, remove exports from the Thread module, and migrate remaining consumers to current sources (`useThreadContext`, `useChannel`, or explicit props).

**Reasoning:**  
Removing the legacy context aligns thread architecture with current rendering boundaries and reduces duplicate state paths.

**Tradeoffs / Consequences:**  
This requires a focused pass over Thread consumers and tests to preserve behavior while deleting legacy APIs. Migration must avoid introducing new prop drilling.

## Decision: Complete remaining Task 43 list-level `threadList` removal by inferring thread scope in list/indicator components

**Date:** 2026-03-03  
**Context:**  
After initial Task 43 delivery, residual `threadList` mode props remained in `MessageList`, `VirtualizedMessageList`, `TypingIndicator`, `ScrollToLatestMessageButton`, and `Thread` wiring, with matching test fixtures still passing `threadList`.

**Decision:**  
Finish Task 43 by removing these remaining `threadList` prop paths and inferring thread scope through `useThreadContext()` in list/indicator components. Update affected tests to provide thread scope with `ThreadProvider` instead of `threadList` flags.

**Reasoning:**  
Thread-vs-main behavior should be contextual and not carried via drill props. Completing the list-level cleanup closes the remaining prop-drilling surface and aligns behavior across message and list layers.

**Tradeoffs / Consequences:**  
Tests now model thread scope through context wrappers, which is closer to production wiring but slightly more setup-heavy in fixtures. Typecheck remains green.

## Decision: Adopt declarative slot topology (`slotNames`) and slot-claimer ownership model

**Date:** 2026-03-05  
**Context:**  
Recent integration feedback showed friction from hard-coded `slot<number>` assumptions and ad hoc list-pane concepts. The desired DX is declarative slot topology with explicit slot claimers (`ChatView.Channels`, `ChannelSlot`, `ThreadSlot`) and policy-driven conflict resolution through controller/navigation APIs.

**Decision:**  
Introduce a declarative slot topology requirement:

- `ChatView` accepts `slotNames` as canonical ordered topology.
- `minSlots`/`maxSlots` initialization and expansion respect configured slot names.
- `ChatView.Channels`, `ChannelSlot`, and `ThreadSlot` claim/request slots; they do not implement replacement policy.
- conflict outcomes remain controller-owned (`duplicateEntityPolicy`, resolver chain).
- no dedicated `entityListSlot` concept is introduced.

**Reasoning:**  
This keeps slot ownership explicit and predictable for custom JSX layouts, removes naming-coupled behavior from navigation internals, and preserves a single policy authority in controller/resolvers.

**Alternatives considered:**

- Keep hard-coded `slot${n}` expansion and rely on documentation only — rejected because behavior remains surprising with custom slot ids.
- Add separate list-pane slot prop (`entityListSlot`) — rejected because it introduces duplicate semantics instead of using generic slot claiming.

**Tradeoffs / Consequences:**  
Integrations gain clearer declarative control but implementation must ensure strict backward compatibility when `slotNames` is omitted.

## Decision: Implement initial `slotNames` topology in ChatView and navigation expansion

**Date:** 2026-03-05  
**Context:**  
Task 45/46 began to make slot topology declarative and remove hard-coded `slot${n}` expansion assumptions.

**Decision:**  
Implement `slotNames?: string[]` on `ChatView` and initialize internal layout state with:

- `slotNames` as ordered topology,
- `availableSlots` from the first `minSlots` names,
- `maxSlots`/`minSlots` clamped against topology length when names are provided.

Also update `useChatViewNavigation()` expansion logic to pick the next slot from ordered topology (`slotNames` first, generated fallback otherwise) instead of constructing `slot${n}` directly.

**Reasoning:**  
This keeps slot ordering declarative and allows named slots (`list`, `main`, `thread`) while preserving backward compatibility for existing numeric slot ids.

**Alternatives considered:**

- Introduce a separate topology context only for navigation — rejected because topology belongs in layout state shared by all slot-aware consumers.
- Make `slotNames` mandatory — rejected to avoid breaking existing integrations.

**Tradeoffs / Consequences:**  
Current tests are updated for initialization and named-slot expansion semantics; full Jest verification remains environment-dependent in this workspace.

## Decision: Add Task 49 for slot-equal navigation and API rename convergence

**Date:** 2026-03-05  
**Context:**  
The spec was updated with final requirements to remove implicit current-slot semantics, separate history/lifecycle/visibility concerns, add forward navigation per slot, and adopt clearer low-level API names (`setSlotBinding`, `openInLayout`).

**Decision:**  
Add Task 49 to `plan.md` and `state.json` as the implementation convergence task for these requirements.

**Reasoning:**  
This keeps Ralph artifacts synchronized and creates a single execution unit for the breaking refactor, test updates, and migration-doc alignment.

**Alternatives considered:**

- Split into multiple micro-tasks immediately — rejected for now to keep sequencing simple while requirements are still converging.
- Leave only spec updates without plan/state tasking — rejected because it breaks Ralph tracking discipline.

**Tradeoffs / Consequences:**  
Task 49 is broad and may later be split into implementation subtasks once execution starts, but current plan/state now reliably track this requirement set.

## Decision: Implement slot-equal controller API with explicit history/visibility separation

**Date:** 2026-03-05  
**Context:**  
Task 49 required removing implicit current-slot behavior, adding forward navigation, and clarifying low-level controller method semantics.

**Decision:**  
Implement the following breaking layout-controller changes:

- remove `activeSlot` from layout state and resolver/duplicate callback args,
- add per-slot `slotForwardHistory` alongside `slotHistory`,
- rename low-level methods:
  - `bind` -> `setSlotBinding`,
  - `open` -> `openInLayout`,
  - `close` -> `goBack`,
  - `setSlotHidden` -> `hide`/`unhide`,
- add `goForward(slot)`,
- keep `clear(slot)` as lifecycle reset separate from history and visibility.

Also update ChatView navigation and slot/entity hooks to avoid implicit slot fallback and use deterministic slot targeting.

**Reasoning:**  
This enforces slot equality, reduces accidental coupling to a hidden "current pane", and makes controller intent explicit by API name.

**Alternatives considered:**

- Keep legacy names as aliases for a transitional period — rejected to keep the breaking contract unambiguous.
- Keep `activeSlot` only as optional hint — rejected because it preserves the same semantic overload problem.

**Tradeoffs / Consequences:**  
Tests and downstream integrations must migrate to renamed methods and explicit slot targeting. In this environment, only typecheck validation was fully runnable.
