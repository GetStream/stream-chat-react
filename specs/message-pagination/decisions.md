# Message Pagination Decisions

## Decision: Use instance-driven pagination as the canonical replacement contract

**Date:** 2026-03-04  
**Context:**  
The migration goal is to make `Channel` and `Thread` operate on the same pagination abstraction and eliminate legacy context-thread pagination controls.

**Decision:**  
Adopt `(thread ?? channel).messagePaginator` as the canonical replacement for legacy `jumpTo*` / `loadMore*` action-context APIs, and `useChatViewNavigation` for thread open/close navigation.

**Reasoning:**  
This keeps data ownership on SDK instances and allows sibling rendering (`Channel` + `Thread`) without requiring nested Channel contexts for thread lifecycle control.

**Alternatives considered:**

- Keep ChannelActionContext as a permanent shim for thread pagination: rejected because it preserves structural coupling.
- Introduce separate React-only thread pagination controller: rejected because it duplicates SDK ownership already available in `MessagePaginator`.

**Tradeoffs / Consequences:**  
Thread paginator behavior in `stream-chat-js` must be fully thread-replies aware before React can rely on it everywhere.

## Decision: Track migration as done vs missing by runtime behavior, not by commented code removal

**Date:** 2026-03-04  
**Context:**  
Several files still contain commented legacy APIs, but many runtime flows already use paginator/navigation instances.

**Decision:**  
Mark work as "done" only when runtime behavior is instance-driven; treat commented legacy remnants as cleanup follow-up.

**Reasoning:**  
Behavioral independence is the core objective; cosmetic cleanup should not be conflated with functional completion.

**Alternatives considered:**

- Define completion by deleting all commented legacy code first: rejected because that may hide unresolved runtime coupling.

**Tradeoffs / Consequences:**  
Plan includes an explicit final cleanup task after core migration and tests.

## Decision: Prioritize thread paginator correctness before broad React context decoupling

**Date:** 2026-03-04  
**Context:**  
Current `Thread` paginator construction in `stream-chat-js` still indicates thread-specific query adaptation is incomplete.

**Decision:**  
Sequence remaining work so `stream-chat-js` thread paginator correctness is completed before final React list/context decoupling.

**Reasoning:**  
React-side migrations (`MessageList`, hooks, actions) cannot be validated safely if the underlying thread paginator does not yet guarantee thread-replies semantics.

**Alternatives considered:**

- Complete React decoupling first and patch JS paginator later: rejected because it risks shipping incorrect pagination behavior in thread views.

**Tradeoffs / Consequences:**  
Cross-repo sequencing is required; React branch depends on upstream JS behavior finalization.

## Decision: Active display routing is owned by ChatView layout, not ChatContext

**Date:** 2026-03-04  
**Context:**  
`ChatContext` currently still exposes `setActiveChannel` and `channel` display routing, while ChatView already has slot-based entity ownership (`LayoutController` + `ChatViewNavigation`).

**Decision:**  
Treat `LayoutController.state.slotBindings` as the sole active display source for Channel/Thread entities, and remove `setActiveChannel` routing from `ChatContext` and `Chat.tsx`.

**Reasoning:**  
Keeping both routing models creates conflicting sources of truth and blocks full sibling `Channel`/`Thread` architecture.

**Alternatives considered:**

- Keep `setActiveChannel` as a long-term compatibility path: rejected because it perpetuates dual routing ownership.
- Mirror layout state back into ChatContext channel field: rejected because it reintroduces coupling instead of removing it.

**Tradeoffs / Consequences:**  
Some integrations/tests that currently drive active display via `setActiveChannel` will need migration to `useChatViewNavigation().openChannel(...)` or equivalent layout-controller binding calls.

## Decision: Migrate channel selection entry points to ChatViewNavigation in the same task as `setActiveChannel` removal

**Date:** 2026-03-04  
**Context:**  
Removing `setActiveChannel` from `ChatContextValue` breaks selection entry points that still call it (`ChannelList`, `ChannelSearch`, and experimental search result items), as well as tests/mocks asserting the old contract.

**Decision:**  
In Task 3, migrate these entry points to `useChatViewNavigation().openChannel(...)` and update directly affected tests/mocks in the same change set.

**Reasoning:**  
This keeps runtime behavior coherent immediately after context API removal and prevents introducing a partially-migrated broken state.

**Alternatives considered:**

- Keep temporary optional `setActiveChannel` in context: rejected because it preserves dual routing ownership.
- Defer selection-entry migration to later task: rejected because TypeScript/runtime breakages would be immediate.

**Tradeoffs / Consequences:**  
Task 3 scope expands beyond ChatContext/Chat wrapper wiring and includes ChannelList/Search selection touchpoints plus related test updates.

## Decision: Remove `channel` from ChatContext after deprecating context-owned active routing

**Date:** 2026-03-04  
**Context:**  
`ChatContext.channel` previously reflected state owned by `setActiveChannel`, which is now removed in favor of layout-controller-owned entity routing.

**Decision:**  
Remove `channel` from `ChatContextValue` and update consumers to resolve channel instance from local/runtime ownership (`Channel` prop, `useChannel()`, or layout bindings).

**Reasoning:**  
Keeping `channel` in chat context would preserve an obsolete pseudo-source-of-truth and invite accidental coupling back to pre-layout routing.

**Alternatives considered:**

- Keep `channel` as always-undefined compatibility field: rejected because it adds noise and misleading API surface.
- Mirror active slot channel back into ChatContext: rejected because it duplicates layout state ownership.

**Tradeoffs / Consequences:**  
Consumers that previously read active channel from chat context had to be migrated (e.g., channel selection flow, geolocation actions, edit-message handler, and unread counter helper paths).

## Decision: Introduce `ChannelSlot` as channel counterpart to `ThreadSlot`

**Date:** 2026-03-04  
**Context:**  
After removing ChatContext-owned active channel routing, `Channel` must receive a concrete channel instance from layout-owned bindings in ChatView compositions.

**Decision:**  
Add `ChannelSlot` that resolves a channel entity from ChatView slot bindings and renders `<Channel channel={resolvedChannel}>...</Channel>`, mirroring `ThreadSlot` behavior for threads.

**Reasoning:**  
This gives a consistent slot-adapter pattern for both channel and thread rendering and removes the need for example/integration code to source channel instance from deprecated ChatContext fields.

**Alternatives considered:**

- Require all integrators to pass `channel` to `<Channel>` manually from custom layout state: rejected because it reimplements slot resolution logic in each integration.
- Fold channel rendering into `ChatView` only via `slotRenderers`: rejected because existing composition patterns benefit from a reusable adapter component.

**Tradeoffs / Consequences:**  
Examples and integrations should migrate to `ChannelSlot` in ChatView flows; direct `<Channel>` usage remains valid when a concrete `channel` prop is provided.

## Decision: Standardize slot binding lookup behind `useSlotEntity` (and typed wrappers)

**Date:** 2026-03-04  
**Context:**  
Slot consumers (`ChannelSlot`, `ThreadSlot`, search/navigation components) repeatedly implement local logic to find active entities from layout bindings, which creates duplicated narrowing code and inconsistent fallback behavior.

**Decision:**  
Introduce a shared `useSlotEntity({ kind, slot? })` hook in ChatView scope, with optional typed wrappers (`useSlotChannel`, `useSlotThread`) for common cases. Migrate slot adapters and selection consumers to this shared API.

**Reasoning:**  
A single lookup contract reduces type errors (for example channel/thread union narrowing pitfalls), avoids drift in fallback rules, and clarifies how entity resolution works across single-slot vs multi-slot render scenarios.

**Alternatives considered:**

- Keep inline per-component slot lookup logic: rejected because it scales duplication and repeats union-type bugs.
- Move all lookup into `ChannelSlot`/`ThreadSlot` only: rejected because non-slot components (search/navigation consumers) still need shared entity resolution semantics.

**Tradeoffs / Consequences:**  
`ChannelSlot` remains a single-slot adapter; multi-pane channel rendering requires multiple `ChannelSlot` instances with explicit slot ids. Omitted-slot fallback remains first-match convenience, not deterministic multi-pane placement.

## Decision: ChannelList auto-hide is driven by layout slot capacity

**Date:** 2026-03-04  
**Context:**  
Channel selection previously relied on `ChatContext.closeMobileNav`, which is not aligned with ChatView layout ownership of visible panes/slots.

**Decision:**  
ChannelList channel selection flow should call `useChatViewNavigation().hideChannelList(...)` only when channel open replaces the existing `channelList` slot binding (that is, no spare visible slot capacity to keep list and opened channel simultaneously).

Also remove `closeMobileNav` from `ChatContext` contract.

**Reasoning:**  
Pane visibility belongs to layout/navigation state (`entityListPaneOpen` + slot hidden flags), not chat context state. This keeps one routing/visibility authority and avoids dual navigation control paths.

**Alternatives considered:**

- Keep `closeMobileNav` as a compatibility shim in `ChatContext`: rejected because it preserves duplicate visibility state ownership.
- Always hide channel list after channel select: rejected because desktop and multi-slot layouts should keep list visible.

**Tradeoffs / Consequences:**  
Auto-hide now follows layout-capacity outcomes directly; behavior is independent of device/user-agent heuristics.
