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
- workspace slots from `visibleSlots`, where each bound entity is rendered by `slotRenderers[entity.kind]`.

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
