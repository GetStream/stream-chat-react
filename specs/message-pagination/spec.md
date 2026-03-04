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

## Non-Goals

- Redesign of non-pagination message mutation APIs (`delete`, `update`, etc.).
- Immediate removal of all Channel contexts from the SDK in one step.
- Introducing new backend endpoints.

## Current State Summary

### Done

- `stream-chat-js`:
- `Channel` exposes `messagePaginator`.
- `Thread` exposes `messagePaginator`.
- `Thread` supports minimal construction (`client + channel + parentMessage`) and reload/hydration flow.

- `stream-chat-react`:
- `ChannelActionContext` already removed legacy pagination/thread methods (`jumpTo*`, `loadMore*`, `openThread/closeThread`, `loadMoreThread`) from its public value type.
- `ThreadProvider` is thread-only (no implicit `<Channel />` wrapper).
- `Thread.tsx` is thread-instance driven and closes via `useChatViewNavigation().closeThread()` (+ `thread.deactivate()` fallback).
- `MessageActions` and `MessageSimple` already use `useChatViewNavigation().openThread(...)`.
- `QuotedMessage`, `MessageAlsoSentInChannelIndicator`, `MessageList`, and `VirtualizedMessageList` already use paginator APIs in at least part of the flow.

### Missing

- `Thread.messagePaginator` in `stream-chat-js` still uses channel-based query behavior and is not thread-replies aware (`src/thread.ts` contains `// todo: pass Thread instance`).
- `MessageList.tsx` still wires infinite scroll to `channel.messagePaginator` directly, which is wrong for thread lists.
- Multiple thread/message flows still depend on `useChannelActionContext` or `useChannelStateContext`, which prevents clean sibling rendering without Channel providers.
- Test suites still contain strong assumptions about legacy Channel context pagination/thread fields (not aligned with the new runtime contract).
- `ChatContext` and `Chat.tsx` still expose and wire `setActiveChannel`/`channel`, which conflicts with layout-controller-owned entity display.

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
- if `slot` is omitted, scan `[activeSlot, ...visibleSlots]` and return the first matching entity by `kind`.
- Consumers such as `ChannelSlot`, `ThreadSlot`, and search result components should prefer this shared hook to avoid duplicated narrowing logic and inconsistent behavior.

### ChannelSlot Multi-Instance Expectations

- `ChannelSlot` is a single-slot adapter, not a multi-channel distributor.
- One rendered `<ChannelSlot slot="...">` maps to at most one channel entity bound to that slot.
- To render multiple channel instances simultaneously, render multiple `ChannelSlot` components with different slot ids.
- If `slot` is omitted, fallback behavior uses first match from `[activeSlot, ...visibleSlots]`; this is convenience behavior and should not be used for deterministic multi-pane layouts.
- Integrators that need deterministic multi-pane channel placement should always provide explicit `slot` to each `ChannelSlot`.

## Legacy to New API Contract

| Legacy API (context era)                    | Replacement API (instance era)                                                                        | Status  |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------- |
| `setActiveChannel(channel)` (`ChatContext`) | `useChatViewNavigation().openChannel(channel, { slot? })` (or low-level `layoutController.open(...)`) | missing |
| `openThread(message, event?)`               | `useChatViewNavigation().openThread({ channel, message })`                                            | done    |
| `closeThread()`                             | `useChatViewNavigation().closeThread()` (+ `thread.deactivate()` fallback in `Thread.tsx`)            | done    |
| `jumpToMessage(messageId, limit?)`          | `(thread ?? channel).messagePaginator.jumpToMessage(messageId, { pageSize })`                         | partial |
| `jumpToLatestMessage()`                     | `(thread ?? channel).messagePaginator.jumpToTheLatestMessage()`                                       | partial |
| `jumpToFirstUnreadMessage(limit?)`          | `channel.messagePaginator.jumpToTheFirstUnreadMessage({ pageSize })`                                  | partial |
| `loadMore(limit?)` (older direction)        | `(thread ?? channel).messagePaginator.toTail()`                                                       | partial |
| `loadMoreNewer(limit?)`                     | `(thread ?? channel).messagePaginator.toHead()`                                                       | partial |
| `loadMoreThread()`                          | `thread.messagePaginator.toTail()/toHead()` (or transitional `thread.loadPrevPage/loadNextPage`)      | missing |
| `threadMessages`                            | `thread.messagePaginator.state.items` (or transitional `thread.state.replies`)                        | partial |
| `threadHasMore`                             | `thread.messagePaginator.state.hasMoreTail`                                                           | missing |
| `threadLoadingMore`                         | `thread.messagePaginator.state.isLoading`                                                             | missing |

## Acceptance Criteria

- `Thread` and `Channel` pagination use the same conceptual API surface (`MessagePaginator`) without Channel-context thread paging fallbacks.
- `MessageList` and `VirtualizedMessageList` select paginator instance from `useMessagePaginator()` so thread lists never use `channel.messagePaginator` by accident.
- Thread subtree message actions and message input flows do not require `ChannelActionContext` / `ChannelStateContext` to function.
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
