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
