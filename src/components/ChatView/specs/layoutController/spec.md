# ChatView Layout Controller Spec

This document describes the currently implemented ChatView layout-controller API.

## Goals

- Keep ChatView as the source of truth for layout state.
- Provide a low-level controller API for advanced integrations.
- Provide an easier built-in layout path for common multi-slot usage.
- Keep existing `activeChatView` usage working during migration.

## Exported API surface

`src/components/ChatView/index.tsx` exports:

- `ChatView` components/hooks/types
- `createLayoutController`
- layout controller types
- slot resolver registry and helpers

## Core types

Implemented in `layoutControllerTypes.ts`.

```ts
type LayoutSlot = string;
type LayoutMode = string;

type LayoutEntityBinding =
  | { key?: string; kind: 'channel'; source: StreamChannel }
  | { key?: string; kind: 'thread'; source: StreamThread }
  | { key?: string; kind: 'memberList'; source: StreamChannel }
  | { key?: string; kind: 'userList'; source: { query: string } }
  | { key?: string; kind: 'pinnedMessagesList'; source: StreamChannel };

type ChatViewLayoutState = {
  activeSlot?: LayoutSlot;
  activeView: ChatView;
  entityListPaneOpen: boolean;
  mode: LayoutMode;
  slotBindings: Record<LayoutSlot, LayoutEntityBinding | undefined>;
  slotMeta: Record<LayoutSlot, { occupiedAt?: number } | undefined>;
  visibleSlots: LayoutSlot[];
};

type OpenResult =
  | { slot: LayoutSlot; status: 'opened' }
  | { replaced: LayoutEntityBinding; slot: LayoutSlot; status: 'replaced' }
  | { reason: 'duplicate-entity' | 'no-available-slot'; status: 'rejected' };
```

## LayoutController contract

Implemented by `createLayoutController(...)`.

```ts
type LayoutController = {
  bind(slot: LayoutSlot, entity?: LayoutEntityBinding): void;
  clear(slot: LayoutSlot): void;
  open(entity: LayoutEntityBinding, options?: OpenOptions): OpenResult;

  openChannel(channel: StreamChannel, options?: OpenOptions): OpenResult;
  openThread(thread: StreamThread, options?: OpenOptions): OpenResult;
  openMemberList(channel: StreamChannel, options?: OpenOptions): OpenResult;
  openUserList(source: { query: string }, options?: OpenOptions): OpenResult;
  openPinnedMessagesList(channel: StreamChannel, options?: OpenOptions): OpenResult;

  setActiveView(next: ChatView): void;
  setMode(next: LayoutMode): void;
  setEntityListPaneOpen(next: boolean): void;
  toggleEntityListPane(): void;

  state: StateStore<ChatViewLayoutState>;
};
```

`open(...)` behavior:

1. Uses requested slot when valid (`options.targetSlot`).
2. Otherwise uses first free visible slot.
3. Otherwise delegates to `resolveTargetSlot` when provided.
4. Returns `rejected` when no slot is available.
5. Applies duplicate policy (`allow`/`move`/`reject`) using `key` identity.
6. Maintains `slotMeta[slot].occupiedAt` on occupy and clears it on clear.

## Resolver registry

Implemented in `layoutSlotResolvers.ts`.

- `requestedSlotResolver`
- `firstFree`
- `existingThreadSlotForThread`
- `existingThreadSlotForChannel`
- `earliestOccupied`
- `activeOrLast`
- `replaceActive`
- `replaceLast`
- `rejectWhenFull`
- `composeResolvers`
- `resolveTargetSlotChannelDefault`
- `layoutSlotResolvers` (central object)

Default chain for channel-centric behavior:

`requestedSlotResolver -> firstFree -> existingThreadSlotForThread -> existingThreadSlotForChannel -> earliestOccupied -> activeOrLast`

## ChatView integration

`ChatView` accepts:

- `maxSlots?: number`
- `resolveTargetSlot?: ResolveTargetSlot`
- `duplicateEntityPolicy?: 'allow' | 'move' | 'reject'`
- `resolveDuplicateEntity?: ResolveDuplicateEntity`
- `entityInferers?: ChatViewEntityInferer[]`
- `layoutController?: LayoutController`
- `layout?: 'nav-rail-entity-list-workspace'`
- `minSlots?: number`
- `SlotFallback?: ComponentType<{ slot: string }>`
- `slotFallbackComponents?: Partial<Record<string, ComponentType<{ slot: string }>>>`
- `slotRenderers?: ChatViewSlotRenderers`

When `layoutController` is not provided, ChatView creates one internally and defaults `resolveTargetSlot` to `resolveTargetSlotChannelDefault`.

Context (`useChatViewContext`) exposes both:

- `activeView` / `setActiveView` (new)
- `activeChatView` / `setActiveChatView` (compatibility alias)
- `layoutController`

## Built-in two-step layout mode

`layout='nav-rail-entity-list-workspace'` renders:

- nav rail (`ChatViewSelector`)
- entity list pane from the slot bound with `kind: 'channelList'`
- workspace area from the remaining visible slots, rendered via `slotRenderers[kind]`
- unbound workspace slots via per-slot fallback components:
  - `slotFallbackComponents[slot]` first
  - then `SlotFallback`
  - then SDK default fallback

Custom-children mode remains unchanged when `layout` is omitted.

## ChannelHeader behavior

`ChannelHeader` now defaults sidebar toggle behavior to ChatView layout state:

- derives list visibility from whether a `channelList` slot binding exists
- default toggle uses hide/unhide (`setEntityListPaneOpen(false/true)`) to keep list slot mounted
- it binds a `channelList` slot only when opening and no list slot is bound yet
- `onSidebarToggle` still overrides default behavior when passed

## Migration notes

From legacy `activeChatView`-only usage:

1. Existing code can continue using `activeChatView`/`setActiveChatView`.
2. New integrations should prefer `activeView`/`setActiveView`.
3. For layout control (slot binding/open/clear), use `layoutController` from `useChatViewContext`.

From custom layout orchestration:

1. Keep current custom children if full control is needed.
2. Optionally migrate to built-in two-step layout:
   - set `layout='nav-rail-entity-list-workspace'`
   - provide `slotRenderers` keyed by entity `kind`

## Usage examples

### Low-level (controller-first)

```tsx
const { layoutController } = useChatViewContext();

layoutController.openChannel(channel, { activate: true });
layoutController.openThread(thread, { targetSlot: 'slot2' });
layoutController.clear('slot1');
layoutController.bind('slot1', {
  kind: 'channelList',
  source: { view: 'channels' },
});
```

### High-level (built-in layout mode)

```tsx
<ChatView
  layout='nav-rail-entity-list-workspace'
  minSlots={2}
  maxSlots={2}
  slotFallbackComponents={{
    slot2: EmptyWorkspacePanel,
  }}
  slotRenderers={{
    channel: ({ source }) => <Channel channel={source} />,
    thread: ({ source }) => <Thread thread={source} />,
  }}
/>
```

## Remaining Follow-up Work

The following are not yet implemented and remain future work:

- Full regression/navigation test sweep for slot stack, unified slots, and ChatView navigation DX
- Receipt reactivity ownership model for channel read/delivery state and tracker-driven UI subscriptions
- Remove `messageIsUnread` from `MessageContextValue` and resolve unread status via `MessageReceiptsTracker` APIs

## Receipt Reactivity State Ownership Contract (Follow-up)

For the receipt reactivity follow-up (Tasks 35-39), state ownership must be explicit:

1. `channel.state.readStore` is the canonical source of truth for per-user read/delivery progress.

   - Owns: `last_read`, `last_read_message_id`, `unread_messages`, `first_unread_message_id`, `last_delivered_at`, `last_delivered_message_id`, `user`.
   - Written by: query/bootstrap ingestion and event handling (`message.read`, `notification.mark_unread`, `message.delivered`).

2. `channel.messageReceiptsTracker` reactive state is a derived/indexed projection.

   - Owns: UI-facing indexed/snapshot data for receipt queries.
   - Written by: receipt reconciliation logic from canonical updates; never treated as canonical.

3. React hooks (`useLastReadData`, `useLastDeliveredData`, related receipt consumers) are read-only consumers.
   - Subscribe to tracker reactive output.
   - Must not maintain an independent receipt source of truth.

Data flow must be one-way:

- event/query -> patch `readStore` (canonical) -> reconcile tracker (derived) -> React render

Implementation guidance for performance-sensitive paths:

- tracker reconciliation should be driven by canonical `readStore` emissions (subscription-driven),
- read updates may carry optional delta metadata (changed/removed user ids) to avoid full key diffing,
- when metadata is absent, deterministic fallback reconciliation from canonical `readStore` must still apply.

Conflict rule:

- if tracker and `readStore` differ, `readStore` wins and tracker must be resynced/rebuilt from canonical state.

## New requirement: Remove `messageIsUnread` from `MessageContextValue`

`messageIsUnread` should no longer be carried as derived state in `MessageContextValue`.

Requirements:

- Remove `messageIsUnread` from the `MessageContextValue` type and provider value.
- Message unread decisions in React UI paths should use `channel.messageReceiptsTracker` APIs.
- Preserve unread separator / first-unread behavior in `MessageList`.
- Do not introduce any additional unread source-of-truth in React; tracker-derived state remains the only unread projection consumed by UI.

## New requirement: Remove legacy `MessageProps.openThread`

`MessageProps` should no longer expose an `openThread` callback prop.

Requirements:

- Remove `openThread` from `src/components/Message/types.ts` `MessageProps`.
- Remove associated `openThread` type-plumbing from `src/components/Message/Message.tsx`.
- Opening a thread from message UI should use `useChatViewNavigation().openThread(...)` as the canonical path.

## New requirement: Remove `MessageProps.threadList` and infer thread scope in leaf components

`MessageProps` should no longer carry `threadList` through prop drilling.

Requirements:

- Remove `threadList` from `src/components/Message/types.ts` `MessageProps`.
- Remove `threadList` propagation from intermediate message-level plumbing (`Message.tsx` and message context payloads that only forward this flag).
- Leaf UI components that need thread-vs-channel behavior must infer it locally via `useThreadContext()`:
  - if a `Thread` instance is present, treat rendering as thread scope,
  - if absent, treat rendering as channel scope.
- Prefer local inference in leaf components (for example message status/reply affordances/“also sent in channel” indicator) and avoid introducing replacement prop drilling.

## New requirement: Remove `LegacyThreadContext`

`LegacyThreadContext` is no longer needed now that `Thread.tsx` is rendered outside `Channel.tsx`.

Requirements:

- Remove `LegacyThreadContext` usage and exports from thread components.
- Remove `LegacyThreadContext` provider wrapping from `Thread.tsx`.
- Remove remaining consumers of `useLegacyThreadContext` by replacing them with current thread/channel sources of truth (`useThreadContext`, `useChannel`, or explicit props as appropriate).
- Keep thread behavior and external API stable except for removing the legacy context surface.

## Thread.tsx Adaptation Plan

`src/components/Thread/Thread.tsx` should adopt the ChatView layout API with the following changes:

1. Use `useChatViewNavigation()` for thread-level navigation actions (open/close/back) instead of local-only thread-close assumptions.
2. On close/back actions, prefer slot-aware transitions (`closeThread`/controller back stack behavior) so one-slot mobile flow is deterministic.
3. Keep existing Thread UI/render behavior unchanged; only route interaction handlers through the navigation/layout API.
4. Preserve compatibility when Thread renders outside ChatView (fallback behavior should remain safe/no-op where layout context is absent).

## New requirement: Slot self-managed visibility

`Slot` must determine whether it is hidden using only its `slot` prop and ChatView layout/controller state.

Requirements:

- `Slot` must not require an external `hidden` (or equivalent) prop to decide visibility.
- Visibility lookup must be deterministic for a given `slot` key.
- Parent layouts may pass rendering context, but visibility authority for a slot remains slot-key driven.

This keeps slot visibility logic encapsulated and reduces divergence between `WorkspaceLayout` orchestration and `Slot` behavior.

## New requirement: LayoutController must be slot-only (no entity-slot notion)

`LayoutController` should not encode any notion of entity semantics (such as entity kinds, entity-specific slot behavior, or entity-aware slot identity).

Requirements:

- `LayoutController` is responsible only for generic slot state and slot operations.
- Slot occupancy and visibility are managed as slot primitives, without entity-specific controller policy.
- Entity/domain mapping (channel, thread, list, search, etc.) must live in higher-level ChatView navigation/composition layers.

This de-opinionates the low-level controller API and keeps domain-specific behavior in higher-level integration APIs.

## Implementation update: Task 17

- `LayoutController` now manages generic slot bindings (`payload`) and slot primitives only.
- High-level domain operations (`openChannel`, `openThread`, hide/unhide channel list) remain in `ChatViewNavigationContext`.
- ChatView no longer models a dedicated `entityListSlot`; all rendered slots flow through the same slot list in `WorkspaceLayout`.

## Implementation update: Task 43

- `MessageProps` no longer includes `threadList`.
- Message wrappers/context no longer drill `threadList` for message leaf branching.
- Message leaf components infer thread scope from `useThreadContext()` presence.

## New requirements: ChannelStateContext decomposition and reactive store migration

### 1) Remove thread pagination fields from `ChannelStateContextValue`

The following fields must be removed from React `ChannelStateContextValue`, because thread pagination state belongs to `Thread` instance state from `ThreadContext`:

- `thread?: LocalMessage | null`
- `threadHasMore?: boolean`
- `threadLoadingMore?: boolean`
- `threadMessages?: LocalMessage[]`
- `threadSuppressAutoscroll?: boolean`

### Implementation update: Task 18

- `ChannelStateContextValue` no longer includes thread pagination/message fields.
- Channel reducer state no longer stores thread pagination/message fields.
- `ChannelActionContext` no longer exposes thread pagination controls (`closeThread`, `loadMoreThread`).
- Thread-aware UI now derives thread state from `ThreadContext` + `Thread.state` selectors (`ThreadStart`, `TypingIndicator`, `ScrollToLatestMessageButton`).

### 2) Introduce dedicated reactive stores in SDK `ChannelState`

In `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, introduce dedicated `StateStore` instances with backward-compatible access paths for:

- `members`
- `read`
- `watcherCount`
- `watchers`

Constraints:

- `members` and `read` each use separate store instances.
- `watcherCount` and `watchers` belong to the same store instance.
- compatibility is required (getters/setters or equivalent adapter path).

`pinnedMessages` migration is explicitly out of scope.

### 3) Move `suppressAutoscroll` out of ChannelStateContext

`suppressAutoscroll` should no longer be carried by `ChannelStateContext`; instead it should be an explicit prop for:

- `MessageList`
- `VirtualizedMessageList`

### 4) Move `typing` ownership to TextComposer reactive state

`typing` ownership should be aligned with the existing `TextComposer` reactive state in:

- `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/messageComposer/textComposer.ts`

### 5) Convert `mutedUsers` to dedicated store

In `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`, convert `mutedUsers` to a dedicated `StateStore` in a backward-compatible way.

## New requirements: reactive `channelConfig` and `channelCapabilities` with removal from `ChannelStateContext`

`channelConfig` and `channelCapabilities` must no longer be provided via `useChannelStateContext`. Their sources must be migrated to reactive SDK stores, and React consumers must subscribe directly to those stores via dedicated hooks/selectors.

### 1) Convert `StreamClient.config` to reactive state

In `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/client.ts`:

- add a `StateStore` source-of-truth for client config,
- preserve backward compatibility for `client.config` property access.

### 2) Convert `channel.data.own_capabilities` to reactive state

In `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts`:

- add a reactive store for `own_capabilities`,
- preserve backward compatibility for existing reads through `channel.data.own_capabilities`.

### 3) Subscribe React SDK (`src/`) to these stores and remove context fields

In `/Users/martincupela/Projects/stream/chat/stream-chat-react-worktrees/chatview-layout-controller/src/`:

- remove `channelConfig` and `channelCapabilities` from `ChannelStateContextValue` and context creation paths,
- subscribe config/capability consumers directly to reactive client-config and own-capabilities stores (via dedicated hooks/selectors),
- keep behavior backward compatible at component level, but not via `useChannelStateContext` fields.

## New requirement: attachment-scoped media config (remove Channel ownership)

The following media/giphy controls must be owned by `Attachment` APIs, not by `Channel` APIs or `ChannelStateContext`:

- `giphyVersion`
- `imageAttachmentSizeHandler`
- `shouldGenerateVideoThumbnail`
- `videoAttachmentSizeHandler`

### Required API direction

- Remove these four options from `ChannelProps`.
- Remove these four values from `ChannelStateContextValue` and channel-state context creation.
- Add these four options to `AttachmentProps`.
- Propagate these values only inside the attachment rendering tree (for example via an attachment-local context/provider).

### Integration intent

`Attachment` can be replaced via `ComponentContext` (`WithComponents`), so integrators should be able to provide these values by overriding `Attachment` and passing the four props directly.

### Compatibility constraint

- Existing attachment rendering behavior must remain unchanged when `Attachment` is not overridden.
- Default values for these four options should remain equivalent to current SDK defaults, but resolved in attachment scope (not channel scope).

## New requirement: `MembersState.memberCount` with backward-compatible `channel.data.member_count` bridge

`MembersState` in `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel_state.ts` must include a `memberCount` property so member state shape is analogous to watcher state (`watcherCount` + `watchers`).

### Required SDK behavior

1. Extend `MembersState` with `memberCount` and ensure `ChannelState` exposes this through the members reactive store path, while preserving existing member map behavior.
2. Preserve backward compatibility for `channel.data.member_count` in `/Users/martincupela/Projects/stream/chat/stream-chat-js-worktrees/thread-constructor-minimal-init/src/channel.ts`.
3. Use the same compatibility bridge pattern used for own capabilities syncing (for example `ChannelState.syncOwnCapabilitiesFromChannelData`):
   - initialize/sync `memberCount` from `channel.data.member_count` when channel data is assigned/replaced in SDK-managed paths,
   - keep direct reads/writes via `channel.data.member_count` compatible while maintaining `memberCount` reactive state as canonical.

### Constraints

- Keep semver-safe behavior for existing integrations reading `channel.data.member_count`.
- Avoid widening scope into unrelated `Channel.data` fields.
- Keep `memberCount` updates deterministic between query/watch/event flows and reactive store subscribers.
