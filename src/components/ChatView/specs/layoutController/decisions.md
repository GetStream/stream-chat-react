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
