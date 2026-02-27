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
- `slotRenderers?: ChatViewSlotRenderers`

When `layoutController` is not provided, ChatView creates one internally and defaults `resolveTargetSlot` to `resolveTargetSlotChannelDefault`.

Context (`useChatViewContext`) exposes both:

- `activeView` / `setActiveView` (new)
- `activeChatView` / `setActiveChatView` (compatibility alias)
- `layoutController`

## Built-in two-step layout mode

`layout='nav-rail-entity-list-workspace'` renders:

- nav rail (`ChatViewSelector`)
- entity list pane (`ChannelList` for channels, `ThreadList` for threads)
- workspace slots, rendered via `slotRenderers[kind]`

Custom-children mode remains unchanged when `layout` is omitted.

## ChannelHeader behavior

`ChannelHeader` now defaults sidebar toggle behavior to ChatView layout state:

- reads `entityListPaneOpen` from `layoutController.state`
- default toggle uses `layoutController.toggleEntityListPane`
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
layoutController.setEntityListPaneOpen(false);
```

### High-level (built-in layout mode)

```tsx
<ChatView
  layout='nav-rail-entity-list-workspace'
  maxSlots={2}
  slotRenderers={{
    channel: ({ source }) => <Channel channel={source} />,
    thread: ({ source }) => <Thread thread={source} />,
  }}
/>
```

## Non-goals in this iteration

The following are not yet implemented and remain future work:

- slot parent stack/back navigation (`slotHistory`)
- `channelList` as a slot entity kind
- `minSlots` + fallback slot rendering
- mount-preserving hide/unhide slot primitive
- `openView` and serializer/restore APIs
- separate `useChatViewNavigation()` high-level hook
