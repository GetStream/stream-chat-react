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
