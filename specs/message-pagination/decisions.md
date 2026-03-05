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

## Decision: Keep `MessagePaginator` as shared paginator type by making it thread-aware via optional parent id

**Date:** 2026-03-04  
**Context:**  
`Thread` still instantiated `MessagePaginator` with channel-only query behavior, causing thread pagination to read channel message dataset instead of thread replies.

**Decision:**  
Extend `MessagePaginator` with optional `parentMessageId`:

- when absent, query channel messages (`channel.query({ messages: ... })`) as before;
- when present, query thread replies (`channel.getReplies(parentMessageId, ...)`);
- include `parent_id` in client-side filters only for thread mode.

`Thread` now constructs `MessagePaginator` with `parentMessageId: thread.id`.

**Reasoning:**  
This preserves the target architecture (single paginator abstraction for channel and thread) while fixing dataset correctness for thread pagination.

**Alternatives considered:**

- Use `MessageReplyPaginator` in `Thread`: rejected for this migration because it introduces dual paginator abstractions instead of converging on one.
- Keep channel-only query path and adapt in React layer: rejected because data ownership/correctness must be fixed at SDK source.

**Tradeoffs / Consequences:**  
`MessagePaginator` now has a mode switch (channel vs thread replies), so tests must cover both query paths. Added coverage in `MessagePaginator.test.ts`.

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

## Decision: Thread-subtree message handlers use optional channel-context with direct instance fallback

**Date:** 2026-03-04  
**Context:**  
Several message/message-input/message-list hooks still assumed `ChannelActionContext` / `ChannelStateContext` presence, which is not guaranteed when rendering `Thread` as a sibling without Channel providers.

**Decision:**  
Introduce optional channel-action context access for these paths and fallback to direct `channel`/`thread` instance operations when context is absent.

Applied in:

- `MessageBounceContext`
- `useSendMessageFn`, `useUpdateMessageFn`, `useRetryHandler`
- `useMarkRead`
- `Message` and message action hooks (`useActionHandler`, `useDeleteHandler`, `useMentionsHandler`, `usePinHandler`, `useReactionHandler`)

**Reasoning:**  
This removes hard runtime coupling to Channel providers for thread flows while preserving existing context-driven behavior where providers are present.

**Alternatives considered:**

- Keep hard Channel context requirement and enforce wrapper nesting: rejected because it conflicts with sibling `Channel`/`Thread` architecture.
- Rebuild a separate React-only action context for threads: rejected due duplication with available channel/thread instance APIs.

**Tradeoffs / Consequences:**  
When outside Channel providers, custom Channel-level action overrides (for example custom delete/update wrappers) are bypassed in favor of direct SDK instance behavior.

## Decision: Retarget Task 5 to complete ChannelActionContext removal in message flows

**Date:** 2026-03-04  
**Context:**  
Task 5 was marked complete under a partial decoupling approach (optional context + direct fallback), but migration intent is stricter: remove `ChannelActionContext` dependency entirely from message interaction flows.

**Decision:**  
Re-open Task 5 and enforce the following final contract:

- notifications via `client.notifications` (`StreamChat.notifications` / `NotificationManager`);
- optimistic message reconciliation via `messagePaginator` APIs (`ingestItem`, `removeItem`);
- no runtime dependence on `ChannelActionContext` for message interaction handlers.

**Reasoning:**  
Optional-context fallback still preserves dual interaction models and leaves migration ambiguous. A single, instance-driven contract is required for predictable sibling Channel/Thread composition.

**Alternatives considered:**

- Keep optional `ChannelActionContext` fallback as end-state: rejected because it preserves legacy coupling and override pathways.
- Defer message optimistic-state migration to cleanup task only: rejected because this is a core runtime contract, not cosmetic cleanup.

**Tradeoffs / Consequences:**  
Some existing Channel-level custom action override hooks will require replacement or new extension points aligned with paginator/client-instance APIs.

## Decision: Use commented `Channel.tsx` legacy actions as parity checklist

## Decision: Resolve mark-read custom handlers in `MessageDeliveryReporter` by collection type

**Date:** 2026-03-04  
**Context:**  
Mark-read customization previously routed through `Channel.markReadRequest`, which mixed channel/thread concerns and kept an unnecessary channel-level indirection for thread reads.

**Decision:**  
Resolve mark-read custom handlers directly in `MessageDeliveryReporter.markRead(...)`:

- channel collections use `channel.configState.requestHandlers.markReadRequest`;
- thread collections use `thread.configState.requestHandlers.markReadRequest`;
- default fallback for both uses `channel.markAsReadRequest(...)`, with `thread_id` enrichment for thread collections.

Also expose `Thread.markRead(...)` as the primary API and keep `Thread.markAsRead(...)` as deprecated alias.

**Reasoning:**  
This keeps handler ownership instance-scoped, avoids cross-collection routing, and keeps read transport semantics centralized in one place.

**Tradeoffs / Consequences:**  
Thread-specific custom mark-read handlers must now be registered on thread instance config (React `useThreadRequestHandlers` updated accordingly).

**Date:** 2026-03-04  
**Context:**  
Large commented legacy blocks in `Channel.tsx` encode previous interaction behavior and can be missed when migration tasks are loosely defined.

**Decision:**  
Treat those commented action blocks as explicit parity checklist in spec coverage:

- `loadMore*`, `jumpTo*`, unread UI state handling,
- notification routing,
- optimistic update/remove/send/retry/edit paths.

**Reasoning:**  
This prevents partial migration claims and forces concrete behavior-by-behavior replacement tracking.

**Alternatives considered:**

- Keep only high-level task wording: rejected because it leaves too much interpretation room and misses edge behavior.

**Tradeoffs / Consequences:**  
Migration progress must be tracked at finer granularity; task completion criteria are stricter.

## Decision: Message interaction optimistic reconcile is paginator-first and MessageOperations-backed

**Date:** 2026-03-04  
**Context:**  
To finish Task 5, message interaction handlers in React needed a concrete contract that matches `stream-chat-js` optimistic operation semantics (`src/messageOperations/MessageOperations.ts`) and avoids Channel action-context coupling.

**Decision:**  
Standardize message interaction behavior on:

- notifications via `client.notifications` (`addSuccess`/`addError`);
- optimistic local reconcile via `messagePaginator.ingestItem` / `messagePaginator.removeItem`;
- send/retry/update via instance APIs that delegate to `messageOperations` (`sendMessageWithLocalUpdate`, `retrySendMessageWithLocalUpdate`, `updateMessageWithLocalUpdate`).

Applied in current pass:

- migrated `Message` notification dispatch away from `ChannelActionContext` wrappers;
- migrated `useActionHandler`, `useDeleteHandler`, `usePinHandler`, `useReactionHandler`, and error-delete action in `MessageActions` to paginator reconcile;
- switched `UnreadMessagesNotification` / `UnreadMessagesSeparator` read actions to instance methods (`thread.markAsRead` / `channel.markRead`);
- switched deprecated `useAudioController` notifications to `client.notifications`;
- updated `Channel.tsx` action-context wrapper implementations (`updateMessage` / `removeMessage`) to call paginator APIs.

**Reasoning:**  
This removes dual state mutation paths (`channel.state.*` vs context wrappers) and aligns React behavior with SDK instance ownership.

**Alternatives considered:**

- Keep optional ChannelActionContext fallback for update/remove operations: rejected because it keeps dual semantics and context coupling.
- Continue writing to `channel.state` directly in handlers: rejected because optimistic lifecycle should be centralized on `MessagePaginator` and MessageOperations.

**Tradeoffs / Consequences:**  
At the time of this decision, `ChannelActionContext` still had remaining legacy customization surfaces (for example mention handlers). Those mention surfaces were removed later when Task 10 was completed.

## Decision: `stream-chat-react` must not call `Thread.upsertReplyLocally` / `deleteReplyLocally`

**Date:** 2026-03-04  
**Context:**  
`Thread` in `stream-chat-js` still exposes `upsertReplyLocally` and `deleteReplyLocally` for backward compatibility. During migration, several `stream-chat-react` hooks still invoked these methods after paginator updates.

**Decision:**  
For `stream-chat-react`, message reconcile in thread flows must be done only via `thread.messagePaginator` APIs (`ingestItem`, `removeItem`, and paginator-driven state subscriptions).  
`Thread.upsertReplyLocally` / `Thread.deleteReplyLocally` remain in `stream-chat-js` as compatibility APIs, but are treated as legacy and not used by React SDK runtime paths.

**Reasoning:**  
Using both paginator reconcile and thread local-reply mutators creates dual state mutation paths and reintroduces coupling to `Thread.state.replies`, which conflicts with the instance-era paginator-first architecture.

**Alternatives considered:**

- Continue using `upsertReplyLocally` in React as a bridge: rejected because it keeps dual state ownership and makes migration completion ambiguous.
- Remove methods from `stream-chat-js`: rejected for backward compatibility.

**Tradeoffs / Consequences:**  
Consumers still using `Thread.state.replies`-based derived UI in React internals must be migrated to paginator state where message data is needed. Compatibility methods remain available for external integrations on `stream-chat-js`.

## Decision: Mention handlers are Message-level API, not Channel-level/context API

**Date:** 2026-03-04  
**Context:**  
`onMentionsClick` / `onMentionsHover` were historically accepted on `Channel` and propagated through `ChannelActionContext`. In the paginator/layout migration this keeps unnecessary cross-context coupling for behavior that belongs to message rendering.

**Decision:**  
Move mention handlers to `Message` props as the primary contract and remove mention handler fields from `ChannelActionContext` and `Channel` props.

**Reasoning:**  
Mention interactions are tied to message text rendering and should be configured where message components are configured. This also reduces remaining reliance on `ChannelActionContext`.

**Alternatives considered:**

- Keep Channel-level mention props and forward into Message handlers: rejected because it preserves legacy context coupling and ambiguous ownership.
- Keep both Channel-level and Message-level APIs long term: rejected because duplicate config paths create precedence ambiguity.

**Tradeoffs / Consequences:**  
Integrations passing mention handlers on `<Channel />` must migrate to message-level configuration (`Message` props / message list integration points). Mention-related tests move from Channel-context assertions to Message-level assertions.

## Decision: Add instance-level delete wrappers in JS SDK and migrate React delete flow to them

**Date:** 2026-03-04  
**Context:**  
`stream-chat-js` currently provides instance-owned optimistic wrappers for `send/retry/update` (`*WithLocalUpdate`) but delete flow is still handled ad-hoc in React (currently direct `client.deleteMessage(...)` + paginator ingest). Also, custom delete request injection is available in React `Channel` props (`doDeleteMessageRequest`) but not in JS instance config handlers.

**Decision:**  
Introduce `deleteMessageWithLocalUpdate` wrappers on `Channel` and `Thread` in `stream-chat-js`, and add handler injection support (`deleteMessageRequest`) in instance config/per-call APIs.  
Then migrate `stream-chat-react` delete flow to call these instance wrappers instead of direct `client.deleteMessage(...)` and context-era delete wrappers.

Naming convention requirement:

- keep operation method naming parallel to existing patterns (`send/retry/update/delete` in `MessageOperations`);
- keep instance wrapper naming parallel (`*WithLocalUpdate`).

**Reasoning:**  
Delete behavior should follow the same ownership model as send/retry/update:

- one instance-level API surface for optimistic/state reconcile semantics;
- one extension point for integrator request customization;
- no React-only fallback logic divergence.

**Alternatives considered:**

- Keep React-level delete wrapper only (`doDeleteMessageRequest` in `Channel.tsx`): rejected because it keeps logic split across layers and blocks consistent instance contract.
- Add delete only on `Channel` and not `Thread`: rejected because thread/message operations should remain symmetric where possible.

**Tradeoffs / Consequences:**  
`MessageOperations` contract likely needs an additional operation kind (`delete`) or a dedicated small operation path with equivalent state policy.  
Migration needs coordinated JS+React updates and tests, but keeps backward compatibility by adding APIs rather than removing existing ones.

## Decision: Mark-read migration scope includes both Channel and Thread flows

**Date:** 2026-03-04  
**Context:**  
Initial Task 12 framing scoped mark-read migration to channel message lists only, while `stream-chat-js` already supports thread read reporting through `Thread.markAsRead()` delegated to `MessageDeliveryReporter`.

**Decision:**  
Expand mark-read migration scope to cover both channel and thread message-list flows:

- channel flows use `channel.markRead(...)`;
- thread flows use `thread.markAsRead(...)`;
- both delegate to `client.messageDeliveryReporter.markRead(...)`.

`ChannelActionContext.markRead` is no longer the target runtime contract for either flow.

**Reasoning:**  
Keeping thread out of scope would leave an unnecessary split contract even though the instance API is already available and aligned (`MessageDeliveryReporter` handles channel vs thread request shape, including `thread_id`).

**Alternatives considered:**

- Keep thread mark-read deferred to a follow-up task: rejected because it preserves dual behavior without technical need.
- Call `channel.markRead` from thread UI paths: rejected because `thread.markAsRead` is the explicit thread-level API and preserves intent.

**Tradeoffs / Consequences:**  
Tests must cover both channel and thread mark-read trigger paths (auto-mark + explicit unread UI actions) and ensure unread snapshot/UI parity during migration away from context-markRead wiring.

## Decision: Custom mark-read overrides are instance-scoped via request handlers

**Date:** 2026-03-04  
**Context:**  
Mark-read customization is needed for both channel and thread surfaces. A proposal to mutate `client.messageDeliveryReporter` from React component lifecycle (`useEffect`) would introduce client-global side effects across slots/channels/threads.

**Decision:**  
Do not mutate `client.messageDeliveryReporter` from React runtime.  
Instead:

- keep `ChannelProps.doMarkReadRequest(channel, options?)`;
- add `ThreadProps.doMarkReadRequest({ thread, options? })`;
- wire both to `channel.configState.requestHandlers.markReadRequest`;
- resolve that handler from `MessageDeliveryReporter.markRead(...)` for both channel and thread calls.

**Reasoning:**  
`messageDeliveryReporter` is client-global state. Per-instance request handlers preserve isolation and avoid race/collision risks in multi-slot layouts while still supporting custom request behavior.

**Alternatives considered:**

- Configure/override reporter methods in React `useEffect`: rejected because it is global mutable state and can leak across unrelated collections.
- Keep channel-only handler signature and infer thread from `options.thread_id`: rejected because thread-level customization should receive explicit thread context.

**Tradeoffs / Consequences:**  
Thread-level customization requires small adapter wiring in `Thread.tsx` to attach/detach scoped handler behavior and preserve previous handler chain on cleanup.

## Decision: Remove `ChannelActionContext` from runtime/public API surface

**Date:** 2026-03-04  
**Context:**  
After migrating message actions, notifications, navigation, and mark-read flows to instance APIs, `ChannelActionContext` no longer provides required runtime behavior.

**Decision:**  
Delete `src/context/ChannelActionContext.tsx`, remove it from context barrel exports, and stop wrapping `Channel` children with `ChannelActionProvider`.

**Reasoning:**  
Keeping an empty/legacy action context invites accidental coupling and stale integrations. Instance APIs (`channel`/`thread` + `messagePaginator`, `useChatViewNavigation`, `client.notifications`) are now the authoritative contract.

**Alternatives considered:**

- Keep an empty compatibility provider indefinitely: rejected because it preserves dead API surface.
- Keep context only for tests/examples: rejected because tests/examples should validate shipped runtime contracts.

**Tradeoffs / Consequences:**  
Legacy tests/stories that imported `ChannelActionProvider`/`useChannelActionContext` must be migrated to current APIs.

## Decision: `suppressAutoscroll` is message-list behavior, not Channel reducer state

**Date:** 2026-03-04  
**Context:**  
`suppressAutoscroll` was historically toggled in `channelState.ts` during legacy load-more flows. That reducer is no longer the runtime source of truth in the paginator-first architecture.

**Decision:**  
Treat `suppressAutoscroll` as list-local behavior driven by paginator/list lifecycle (`toTail`/loading transitions), and remove dependency on `channelState.ts` semantics.

**Reasoning:**  
Autoscroll suppression is a scroll policy concern in message-list rendering, not channel-global state. Keeping it in legacy reducer logic blocks final Channel-state-context cleanup and creates hidden coupling.

**Alternatives considered:**

- Keep reducer-driven suppression and pass it through Channel context: rejected because it preserves legacy ownership and context coupling.
- Drop suppression behavior entirely: rejected because it risks regressions while paginating older messages.

**Tradeoffs / Consequences:**  
`MessageList` and `VirtualizedMessageList` must implement/verify equivalent suppression behavior from modern state paths, with regression tests for pagination while scrolled up.

## Decision: Decompose `ChannelStateContext` into instance provider + list-local data inputs

**Date:** 2026-03-04  
**Context:**  
`ChannelStateContext` currently mixes channel instance access and list-level data transport (`notifications`), while paginator-first flows now derive message/read state from instance stores.

**Decision:**  
Remove `ChannelStateContext` in staged steps:

- keep channel instance access through a dedicated minimal channel-instance provider (or equivalent source),
- move list-specific inputs (`notifications`) to explicit list contracts,
- migrate list/message runtime consumers and test/story wrappers accordingly.

**Reasoning:**  
This avoids replacing one oversized context with another while keeping `useChannel()` and list components operational during migration.

**Alternatives considered:**

- Keep `ChannelStateContext` permanently as a thin wrapper: rejected because it preserves legacy API surface and naming mismatch.
- Remove context in one shot without replacement provider: rejected because `useChannel()` and many consumers need a stable channel source.

**Tradeoffs / Consequences:**  
Migration requires coordinated runtime + test/story updates, but yields clearer ownership boundaries (instance source vs list rendering state).

## Decision: `channelConfig` and `channelCapabilities` are channel-owned, not ChannelStateContext-owned

**Date:** 2026-03-04  
**Context:**  
Some tests were still injecting `channelConfig` / `channelCapabilities` through `ChannelStateProvider`, while runtime behavior already resolves these values from channel-owned stores/hooks.

**Decision:**  
Do not expose or consume `channelConfig` / `channelCapabilities` through `ChannelStateContext`.

- Capabilities are resolved from `channel.state.ownCapabilitiesStore` (via `useChannelCapabilities`).
- Config is resolved from channel config state (`useChannelConfig` / client config store).

**Reasoning:**  
This keeps one source of truth aligned with instance-driven architecture and avoids preserving deprecated context shape.

**Alternatives considered:**

- Keep context copies for test convenience: rejected because it encourages runtime drift and blocks full context removal.

**Tradeoffs / Consequences:**  
Tests must configure capabilities/config on channel instances (or client config store) instead of passing them via `ChannelStateProvider`.

## Decision: Complete Task 18 by deleting `ChannelStateContext` and `channelState.ts`

**Date:** 2026-03-04  
**Context:**  
After runtime migration and test/story migration to instance-based channel sourcing, `ChannelStateContext.tsx` and `src/components/Channel/channelState.ts` had no remaining runtime ownership role.

**Decision:**  
Delete `ChannelStateContext.tsx` and `src/components/Channel/channelState.ts`, remove context export from `src/context/index.ts`, and migrate remaining tests/examples to `ChannelInstanceProvider` / `useChannel`.

**Reasoning:**  
Keeping dead legacy state/context files increases API ambiguity and invites accidental coupling back to pre-paginator architecture.

**Alternatives considered:**

- Keep a deprecated no-op `ChannelStateContext` shim: rejected because it preserves obsolete surface area without providing functional value.

**Tradeoffs / Consequences:**  
Any external code importing `ChannelStateProvider`/`useChannelStateContext` must migrate to instance-based APIs (`useChannel`, `ChannelInstanceProvider`).

## Decision: Close remaining JS SDK parity gaps from commented `Channel.tsx` logic

**Date:** 2026-03-05  
**Context:**  
The commented legacy blocks in `src/components/Channel/Channel.tsx` were re-audited against `stream-chat-js` ownership (`MessagePaginator`, `MessageOperations`, `MessageDeliveryReporter`).

Most behavior is already covered, but two concrete SDK-level gaps remain:

- `jumpToTheFirstUnreadMessage` lacks the legacy timestamp fallback when unread ids are unavailable.
- send pipeline no longer applies legacy pre-send failed-message cleanup (`filterErrorMessages` equivalent).

**Decision:**  
Track these as a dedicated follow-up (`Task 19`) scoped to `stream-chat-js`:

- implement timestamp-based unread jump fallback + inferred snapshot hydration;
- define explicit failed-send cleanup policy in `MessageOperations.send` (or equivalent policy layer).

**Reasoning:**  
Both gaps are data/operation ownership concerns and should be solved in the JS SDK rather than reintroduced in React adapters.

**Alternatives considered:**

- Accept current behavior as intentional deprecation: rejected because parity/deprecation decision was not explicitly approved.
- Re-implement both in React only: rejected because it duplicates SDK responsibilities and risks divergence across SDK consumers.

**Tradeoffs / Consequences:**  
Unread fallback logic becomes more complex and requires explicit tests for edge cases (unknown ids, partially loaded windows, whole-channel-unread scenarios). Failed-send cleanup needs guardrails to avoid deleting user-actionable failed items unexpectedly.
