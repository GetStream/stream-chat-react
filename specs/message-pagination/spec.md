# Message Pagination Independence Spec

## Problem Statement

`stream-chat-react` is mid-migration from Channel-context-driven pagination/thread controls to instance-driven APIs backed by `MessagePaginator`.

The target architecture is:

- `stream-chat-js` `Channel` and `Thread` instances both expose `messagePaginator` as the pagination source of truth.
- `Channel.tsx` and `Thread.tsx` can be rendered as siblings.
- Thread/message UI behavior no longer depends on `ChannelActionContext` / `ChannelStateContext` pagination-thread fields.
- Active `Channel` / `Thread` display instances are sourced from ChatView layout bindings (via `LayoutController` and `ChatViewNavigation`), not from `ChatContext.setActiveChannel`.

## Goal

Define a concrete replacement contract from legacy context APIs to `Channel` / `Thread` instance APIs (especially `MessagePaginator`), and document what is already completed versus what is still missing.

Explicitly for message interactions:

- remove `ChannelActionContext` as a required runtime API surface;
- send user-facing notifications via `client.notifications` (`NotificationManager`, `StreamChat.notifications`);
- perform optimistic message state reconciliation (`upsert` / `remove`) through `MessagePaginator` API, not via ChannelActionContext wrappers.

## Non-Goals

- Immediate removal of all Channel contexts from the SDK in one step.
- Introducing new backend endpoints.

## Current State Summary

### Done

- `stream-chat-js`:
- `Channel` exposes `messagePaginator`.
- `Thread` exposes `messagePaginator`.
- `Channel.messageOperations` / `Thread.messageOperations` use `MessagePaginator` ingest/get for optimistic `send/retry/update`.
- `Thread` supports minimal construction (`client + channel + parentMessage`) and reload/hydration flow.
- `Thread.messagePaginator` is thread-aware (`parentMessageId`) and queries replies dataset.
- `Thread` `message.new` subscription now ingests replies into `thread.messagePaginator` and updates thread-local `replyCount` only (channel metadata ownership stays with `Channel`).
- `Channel` `message.updated` / `message.undeleted` now ingest into `channel.messagePaginator`, keeping parent-message metadata (`reply_count`, `thread_participants`) synchronized for channel-list UI.
- `ChatViewNavigation.openThread({ channel, message })` reuses `client.threads.threadsById[message.id]` when available instead of always constructing a new thread instance.
- `Thread.tsx` no longer forces `thread.reload()` on every mount; unmanaged threads reload only when their paginator has no first-page data yet.
- `Thread.tsx` registers unmanaged thread instances into `ThreadManager` only after the first paginator page has loaded successfully (`messagePaginator.state.items !== undefined` and no `lastQueryError`).

- `stream-chat-react`:
- `ChannelActionContext` already removed legacy pagination/thread methods (`jumpTo*`, `loadMore*`, `openThread/closeThread`, `loadMoreThread`) from its public value type.
- `ChannelActionContext` is removed from runtime/public exports and `Channel` no longer wraps children with `ChannelActionProvider`.
- `ThreadProvider` is thread-only (no implicit `<Channel />` wrapper).
- `Thread.tsx` is thread-instance driven and closes via `useChatViewNavigation().closeThread()` (+ `thread.deactivate()` fallback).
- `MessageActions` and `MessageSimple` already use `useChatViewNavigation().openThread(...)`.
- `QuotedMessage`, `MessageAlsoSentInChannelIndicator`, `MessageList`, and `VirtualizedMessageList` already use paginator APIs in at least part of the flow.
- Message mutation handlers (`action/delete/pin/reaction`, error-message delete action, and Channel wrappers) reconcile optimistic updates/removals through `messagePaginator`.
- Message notification writes in migrated paths use `client.notifications`.
- `stream-chat-react` message runtime handlers no longer call `thread.upsertReplyLocally` / `thread.deleteReplyLocally`.
- Mention handling migration is complete: mention handlers are configured at `Message` level and no longer exposed via `Channel`/`ChannelActionContext`.
- Channel message-list read actions already call instance APIs directly (`channel.markRead()` / `thread.markRead()` in notification/separator components).
- Channel message-mutation tests (`send/retry/update/delete/remove` block) were migrated to call instance APIs (`*WithLocalUpdate`, `messagePaginator.removeItem`) instead of legacy Channel action-context callbacks.
- `Channel.test.js` coverage is intentionally scoped to React integration concerns; legacy deep pagination/unread algorithm scenarios are skipped there and owned by `stream-chat-js` paginator/message-delivery unit tests.

### Missing

- Channel test coverage was re-scoped to current component ownership (bootstrap/render/event wiring), while paginator/unread algorithms remain covered in `stream-chat-js` unit tests.
- Mention-handler migration is in progress; remaining docs/tests need full Message-level contract alignment.
- `suppressAutoscroll` behavior is still effectively specified by legacy `channelState.ts` reducer semantics and is not yet expressed as an instance-owned list contract.
- Channel bootstrap UI contract is implemented and covered by targeted Channel bootstrap tests (Task 20).
- `stream-chat-js` does not yet expose `deleteMessageWithLocalUpdate` wrappers on `Channel` / `Thread` equivalent to existing `send/retry/update` local-update APIs.
- `stream-chat-js` `ChannelInstanceConfig.requestHandlers` does not include `deleteMessageRequest`, so integrators cannot inject custom delete logic through instance configuration.
- `stream-chat-react` still carries `doDeleteMessageRequest` in `Channel` prop/context-era flow; this should migrate to instance-level delete wrapper usage.
- Story and docs references still need full pass to remove legacy context terminology from comments/examples where not yet migrated.

### Completed ChannelStateContext Removal

- `ChannelStateContext.tsx` is deleted.
- `channelState.ts` is deleted.
- `useChannel()` resolves via `Thread` or `ChannelInstanceContext`.
- `MessageList` and `VirtualizedMessageList` consume notification/unread state from paginator/client stores, not channel-state context.
- stories/tests were migrated off `ChannelStateProvider`.

## Instance Ownership Contract (Layout First)

- `LayoutController.state.slotBindings` is the source of truth for which `Channel`/`Thread` instance is displayed in each slot.
- `ChatViewNavigation` is the public imperative API to bind/open/close Channel and Thread entities.
- `Channel`/`Thread` renderers consume instances from layout bindings (for example through slot renderers / slot adapters), not from `ChatContext.channel`.
- Slot adapters are first-class integration points:
- `ThreadSlot` resolves thread instances from layout slot bindings.
- `ChannelSlot` resolves channel instances from layout slot bindings.
- Channel selection UI (`ChannelList` / `ChannelPreview`) opens channels through `ChatViewNavigation.openChannel(...)` (or equivalent `layoutController.open(...)` wrapper), not `setActiveChannel(...)`.
- `ChatContext` must no longer own active-entity selection:
- remove `setActiveChannel` from `src/context/ChatContext.tsx`.
- remove `setActiveChannel` wiring and usage from `src/components/Chat/Chat.tsx`.
- remove `closeMobileNav` routing from `ChatContext` where channel-list visibility is now layout-driven.
- `ChatContext` remains for shared infra concerns (client, theme, search controller, nav flags, etc.), not active channel routing.
- `ChannelList` selection should hide the list through `useChatViewNavigation().hideChannelList(...)` only when opening a channel consumes/replaces the slot currently bound to `channelList` (no spare slot capacity to keep both panes visible).

## Slot Entity Resolution Pattern

- Repeated slot-entity resolution logic should be centralized into a shared hook in ChatView scope:
- `useSlotEntity({ kind, slot? })` for generic entity lookup from layout bindings.
- Optional typed wrappers:
- `useSlotChannel({ slot? })`
- `useSlotThread({ slot? })`
- Behavior contract:
- if `slot` is provided, resolve from that slot only;
- if `slot` is omitted, scan `[activeSlot, ...availableSlots]` and return the first matching entity by `kind`.
- Consumers such as `ChannelSlot`, `ThreadSlot`, and search result components should prefer this shared hook to avoid duplicated narrowing logic and inconsistent behavior.

### ChannelSlot Multi-Instance Expectations

- `ChannelSlot` is a single-slot adapter, not a multi-channel distributor.
- One rendered `<ChannelSlot slot="...">` maps to at most one channel entity bound to that slot.
- To render multiple channel instances simultaneously, render multiple `ChannelSlot` components with different slot ids.
- If `slot` is omitted, fallback behavior uses first match from `[activeSlot, ...availableSlots]`; this is convenience behavior and should not be used for deterministic multi-pane layouts.
- Integrators that need deterministic multi-pane channel placement should always provide explicit `slot` to each `ChannelSlot`.

## Legacy to New API Contract

| Legacy API (context era)                                    | Replacement API (instance era)                                                                                                   | Status  |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `setActiveChannel(channel)` (`ChatContext`)                 | `useChatViewNavigation().openChannel(channel, { slot? })` (or low-level `layoutController.open(...)`)                            | missing |
| `addNotification(text, type)` (`ChannelActionContext`)      | `channel.getClient().notifications.addSuccess/addError(...)`                                                                     | done    |
| `markRead(options?)` (`ChannelActionContext`)               | `channel.markRead(options?)` or `thread.markAsRead(options?)` -> `client.messageDeliveryReporter.markRead(collection, options?)` | partial |
| `deleteMessage(message, options?)` (`ChannelActionContext`) | `(thread ?? channel).deleteMessageWithLocalUpdate(...)` (JS instance wrapper)                                                    | missing |
| `updateMessage(message)` (`ChannelActionContext`)           | `messagePaginator.ingestItem(message)`                                                                                           | partial |
| `removeMessage(message)` (`ChannelActionContext`)           | `messagePaginator.removeItem({ item: message })` (or `{ id: message.id }`)                                                       | partial |
| `openThread(message, event?)`                               | `useChatViewNavigation().openThread({ channel, message })`                                                                       | done    |
| `closeThread()`                                             | `useChatViewNavigation().closeThread()` (+ `thread.deactivate()` fallback in `Thread.tsx`)                                       | done    |
| `jumpToMessage(messageId, limit?)`                          | `(thread ?? channel).messagePaginator.jumpToMessage(messageId, { pageSize })`                                                    | partial |
| `jumpToLatestMessage()`                                     | `(thread ?? channel).messagePaginator.jumpToTheLatestMessage()`                                                                  | partial |
| `jumpToFirstUnreadMessage(limit?)`                          | `channel.messagePaginator.jumpToTheFirstUnreadMessage({ pageSize })`                                                             | partial |
| `loadMore(limit?)` (older direction)                        | `(thread ?? channel).messagePaginator.toTail()`                                                                                  | partial |
| `loadMoreNewer(limit?)`                                     | `(thread ?? channel).messagePaginator.toHead()`                                                                                  | partial |
| `loadMoreThread()`                                          | `thread.messagePaginator.toTail()/toHead()` (or transitional `thread.loadPrevPage/loadNextPage`)                                 | missing |
| `threadMessages`                                            | `thread.messagePaginator.state.items` (or transitional `thread.state.replies`)                                                   | partial |
| `threadHasMore`                                             | `thread.messagePaginator.state.hasMoreTail`                                                                                      | missing |
| `threadLoadingMore`                                         | `thread.messagePaginator.state.isLoading`                                                                                        | missing |

## MessageOperations Alignment

`stream-chat-js` owns optimistic state semantics in `src/messageOperations/MessageOperations.ts`.

- `send/retry/update` optimistic lifecycle is funneled through `channel.messageOperations` / `thread.messageOperations`.
- delete flow is currently outside this lifecycle and should be aligned with the same instance-owned contract.
- Both instances are configured with:
- `ingest: (m) => messagePaginator.ingestItem(m)`
- `get: (id) => messagePaginator.getItem(id)`
- React layer should call instance APIs (`sendMessageWithLocalUpdate`, `retrySendMessageWithLocalUpdate`, `updateMessageWithLocalUpdate`) and use `messagePaginator` for local optimistic reconcile in custom flows (`ingestItem`/`removeItem`).
- In `stream-chat-react`, do not call `thread.upsertReplyLocally` / `thread.deleteReplyLocally`; keep thread message-state reconcile strictly paginator-driven.
- Add and consume `deleteMessageWithLocalUpdate` on `Channel` / `Thread` so delete flow follows the same instance contract and supports custom request handler injection.

## Message Focus Signal Contract

`MessagePaginator` publishes a reactive `messageFocusSignal` state for jump/navigation intents.

- `messageId: string`
  : target message that became the focus target.
- `reason: 'jump-to-message' | 'jump-to-first-unread' | 'jump-to-latest'`
  : semantic cause of focus, so UI can differentiate behaviors.
- `token: number`
  : monotonically increasing unique signal id; consumers can distinguish repeated focus events for the same `messageId` and ignore stale clears.
- `createdAt: number`
  : timestamp (`Date.now()`) when signal was emitted.
- `ttlMs: number`
  : advisory signal lifetime; signal auto-clears after TTL.

State semantics:

- store shape is `{ signal: MessageFocusSignal | null }`;
- signal is emitted by paginator jump APIs unless explicitly suppressed;
- clear operation supports token-aware stale-timer protection.

UI consumption semantics:

- selectors should return object-shaped values for stable store subscription patterns (for example `{ messageFocusSignal: state.signal }`);
- message focus in list UIs is single-source and paginator-owned; `VirtualizedMessageList` must not accept a parallel `highlightedMessageId` prop source;
- lists may map focus signal to visual highlight, scroll-to-center, animation, or any other focus affordance;
- naming stays generic (`messageFocusSignal`) to describe the event, not a specific visual outcome.

## Mark Read Contract (Channel + Thread)

- Primary contract for channel lists is `channel.markRead(options?)`; `Channel.markRead` delegates to `client.messageDeliveryReporter.markRead(channel, options?)`.
- Primary contract for thread lists is `thread.markRead(options?)`; `Thread.markRead` delegates to `client.messageDeliveryReporter.markRead(thread, options?)`.
- `thread.markAsRead(options?)` remains as a deprecated alias for backward compatibility.
- `MessageDeliveryReporter.markRead` clears tracked delivery candidates for the collection after the request path and centralizes Channel/Thread read reporting semantics.
- `MessageDeliveryReporter` resolves custom mark-read handlers per collection type:
- channel collections use channel `configState.requestHandlers.markReadRequest`;
- thread collections use thread `configState.requestHandlers.markReadRequest`.
- Default fallback for both is `channel.markAsReadRequest(...)`, with `thread_id` enrichment when collection is thread.
- React unread UI flows should call these instance methods directly and not depend on `ChannelActionContext.markRead`.
- Custom mark-read override contract is instance-scoped (not client-global):
- `Channel` may accept `doMarkReadRequest(channel, options?)`.
- `Thread` may accept `doMarkReadRequest({ thread, options? })`.
- channel handler is channel-only (no `thread` argument); thread-specific customization belongs to thread handler.
- channel override is wired into `channel.configState.requestHandlers.markReadRequest`;
- thread override is wired into `thread.configState.requestHandlers.markReadRequest`.
- `MessageDeliveryReporter` remains immutable at runtime; customization happens through per-instance request handlers to avoid cross-slot/channel interference.
- Thread keeps custom-request parity with Channel for message operations:
- `doDeleteMessageRequest`, `doSendMessageRequest`, `doUpdateMessageRequest`, `doMarkReadRequest`.
- these thread overrides are scoped to the active thread and chained with existing channel request handlers.

## Autoscroll Suppression Contract (`suppressAutoscroll`)

- Legacy ownership lived in `src/components/Channel/channelState.ts` reducer (`setLoadingMore` => `suppressAutoscroll: true` while loading older pages).
- In the instance-driven model, autoscroll suppression belongs to message-list scroll manager behavior, not Channel context reducer state.
- Target contract:
- when paginating older messages (`messagePaginator.toTail()` in reverse list mode), temporary auto-scroll-to-bottom must be suppressed;
- suppression clears once pagination settles and normal bottom-follow behavior resumes;
- behavior must be identical in `MessageList` and `VirtualizedMessageList`.
- The suppression signal should come from paginator/list runtime state (or dedicated list-local state), not `ChannelStateContext`.
- Migration should remove any remaining dependency on `channelState.ts` semantics for this behavior and document the replacement explicitly.

## Channel Bootstrap Contract (Initial Page Only)

- `Channel.tsx` must own bootstrap loading/error UI only for initial channel initialization/watch query:
  - apply when `initializeOnMount === true` and `channel.initialized === false`;
  - render `LoadingIndicator` while initial request is in progress;
  - render `LoadingErrorIndicator` when initial request fails.
- This contract is scoped to the first-page bootstrap only.
- Pagination/loading failures after initial load are message-list concerns and must stay handled in `MessageList` / `VirtualizedMessageList`.
- Bootstrap UI must be instance-scoped (the concrete rendered channel), not only global `channelsQueryState`, to avoid ambiguity with slot-driven multi-entity layouts.

## ChannelStateContext Removal Contract

- Completed in this branch:
- channel instance sourcing now uses `ChannelInstanceContext` (`useChannel()` thread-first fallback preserved);
- list/runtime consumers no longer use `useChannelStateContext`;
- `ChannelStateProvider` was removed from runtime and test/story scaffolding;
- legacy reducer file `src/components/Channel/channelState.ts` was removed.

## Coverage Matrix: `Channel.tsx` Commented Legacy Actions

The following legacy commented flows in `src/components/Channel/Channel.tsx` must be fully covered by instance-driven replacements:

| Legacy commented flow in `Channel.tsx`                 | Instance-era replacement contract                                                                 | Coverage status |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | --------------- |
| `loadMore(limit?)`                                     | `messagePaginator.toTail()`                                                                       | done            |
| `loadMoreNewer(limit?)`                                | `messagePaginator.toHead()`                                                                       | done            |
| `jumpToMessage(messageId, limit?, highlightDuration?)` | `messagePaginator.jumpToMessage(messageId, { pageSize })` + UI highlight wiring in list layer     | partial         |
| `jumpToLatestMessage()`                                | `messagePaginator.jumpToTheLatestMessage()`                                                       | partial         |
| `jumpToFirstUnreadMessage(limit?, highlightDuration?)` | `messagePaginator.jumpToTheFirstUnreadMessage({ pageSize })` backed by unread snapshot/read state | partial         |
| `setChannelUnreadUiState(...)`                         | `messagePaginator.unreadStateSnapshot` as unread UI source of truth                               | partial         |
| `addNotification(text, type)`                          | `client.notifications.addSuccess/addError(...)`                                                   | done            |
| `deleteMessage(message, options?)`                     | `deleteMessageWithLocalUpdate` via JS instance wrapper + optional `deleteMessageRequest` handler  | missing         |
| `updateMessage(message)` optimistic path               | `messagePaginator.ingestItem(message)`                                                            | partial         |
| `removeMessage(message)` optimistic path               | `messagePaginator.removeItem({ item: message })` or `{ id: message.id }`                          | partial         |
| `sendMessage(...)` optimistic reconciliation           | `sendMessageWithLocalUpdate` + paginator-driven optimistic state                                  | partial         |
| `retrySendMessage(...)` optimistic reconciliation      | `retrySendMessageWithLocalUpdate` + paginator-driven optimistic state                             | partial         |
| `editMessage(...)` optimistic reconciliation           | `updateMessageWithLocalUpdate` + paginator-driven optimistic state                                | partial         |

## Channel.tsx Commented Logic: JS SDK Parity Audit (2026-03-05)

### Already Covered in `stream-chat-js`

- `loadMore` / `loadMoreNewer` semantics are covered by `MessagePaginator.toTail()` / `toHead()`.
- `jumpToMessage` and `jumpToLatestMessage` are covered by:
  - `MessagePaginator.jumpToMessage(...)`
  - `MessagePaginator.jumpToTheLatestMessage(...)`
- highlight signal behavior is covered by `MessagePaginator.messageFocusSignal`.
- unread snapshot ownership is covered by `MessagePaginator.unreadStateSnapshot`.
- `notification.mark_unread` and `channel.truncated` unread-snapshot synchronization is already implemented in `Channel._handleChannelEvent`.
- send/retry/update optimistic reconciliation (including duplicate message handling and newer-vs-stale response protection) is covered by `MessageOperations` + `MessageOperationStatePolicy`.
- delete optimistic reconciliation is covered by `deleteMessageWithLocalUpdate` wrappers on both `Channel` and `Thread`.
- mark-read ownership is covered by `MessageDeliveryReporter.markRead` for both channel and thread, with collection-specific custom handlers.

### Remaining JS SDK Gaps (Not Yet at Legacy Parity)

- No open JS SDK gaps remain from the commented `Channel.tsx` parity audit.
- `jumpToTheFirstUnreadMessage` now supports timestamp fallback (`created_at_around`) when unread ids are missing and hydrates `unreadStateSnapshot` with inferred unread boundaries.

### Explicitly Not Ported Blindly

- Legacy `channel.state.filterErrorMessages()` pre-send cleanup is **not** treated as required parity by default.
- Reason: modern paginator/message-operations flow keeps failed messages as actionable retry items; blind cleanup can be destructive UX.
- Any reintroduction must be driven by explicit product behavior requirements (for example configurable retry-queue pruning), not legacy-code carryover.
- `beforeSend` is removed from `stream-chat-js`; this migration does **not** reintroduce an equivalent hook only to preserve legacy cleanup behavior.

### Necessity Filter for Remaining Porting

- Required parity that was ported in JS SDK:
  - `jumpToTheFirstUnreadMessage` timestamp fallback (`created_at_around`) when unread ids are unknown.
  - unread snapshot hydration after fallback (populate inferred first/last unread ids).
- Not required parity to port (documented deprecations/non-goals):
  - pre-send failed-message cleanup (`filterErrorMessages`-style behavior);
  - reducer-era loading/error flags and throttled reducer copy semantics;
  - document-title side effects (`activeUnreadHandler` ownership remains React/UI layer).

### Explicitly Out of JS SDK Scope (React/UI Ownership)

- document title updates (`activeUnreadHandler` / `document.title`) stay in React.
- loading/error spinner state previously in local reducer (`state.loading`, `state.error`) stays in React rendering concerns.
- reducer-specific throttling/debouncing knobs (`loadMoreFinished`, `throttledCopyStateFromChannel`) are replaced by paginator/store semantics and are not 1:1 JS SDK responsibilities.

## Acceptance Criteria

- `Thread` and `Channel` pagination use the same conceptual API surface (`MessagePaginator`) without Channel-context thread paging fallbacks.
- `MessageList` and `VirtualizedMessageList` select paginator instance from `useMessagePaginator()` so thread lists never use `channel.messagePaginator` by accident.
- Thread subtree message actions and message input flows do not require `ChannelActionContext` / `ChannelStateContext` to function.
- `ChannelActionContext` is no longer required by message interaction flows (notification, optimistic update, retry/delete/update/pin/reaction/action handlers).
- Notification writes in migrated flows use `client.notifications` APIs directly.
- Optimistic message state updates in migrated flows reconcile via `messagePaginator` (`ingestItem` / `removeItem`) instead of ChannelActionContext update/remove wrappers.
- `stream-chat-react` runtime message flows do not call `Thread.upsertReplyLocally` / `Thread.deleteReplyLocally`.
- Message delete flow is served by `Channel` / `Thread` instance wrappers (`deleteMessageWithLocalUpdate`) with optional custom `deleteMessageRequest`.
- Channel and thread message-list mark-read flows do not depend on `ChannelActionContext.markRead`; they call `channel.markRead` / `thread.markAsRead` (message-delivery-reporter-backed) directly.
- `ChatContext` no longer exposes `setActiveChannel` or active `channel` as the display-routing mechanism.
- Channel/thread visibility is driven by entities bound in `LayoutController` (`slotBindings`) and manipulated via `ChatViewNavigation`.
- Clicking a channel preview in `ChannelList` binds/opens that channel in layout state (slot binding), and active preview state is derived from layout-bound channel identity.
- Example apps using ChatView should render channel/thread workspaces via slot adapters (`ChannelSlot` / `ThreadSlot`) rather than relying on ChatContext active-channel state.
- Slot-aware consumers use the shared slot-entity hook(s) instead of implementing custom slot scanning logic inline.
- Legacy tests are updated to verify instance-driven behavior (and fail on context-thread pagination regressions).

## Constraints

- Maintain backward compatibility where possible with additive/deprecation-first changes.
- Keep API import boundaries (`stream-chat` imports by package name).
- Keep behavior compatible with existing ChatView navigation model.
