# ChatView Layout Controller Spec

This spec describes the current implementation in `src/components/ChatView`.

## API Surface

`src/components/ChatView/index.tsx` exports:

- `ChatView` components/hooks/types
- `ChatViewNavigationContext` API
- layout controller types + serialization helpers
- slot resolver helpers/registry

Note:

- `LayoutController` class implementation exists at
  `src/components/ChatView/layoutController/LayoutController.ts`.
- It is intentionally not re-exported from `src/components/ChatView/index.tsx`.

## Core State Model

`ChatViewLayoutState` is view-scoped. Slot state is stored only under `*ByView` maps.

```ts
type ChatViewLayoutState = {
  activeView: ChatView;
  maxSlots?: number;
  minSlots?: number;

  listSlotByView?: Partial<Record<ChatView, SlotLayout>>;

  availableSlotsByView?: Partial<Record<ChatView, SlotLayout[]>>;
  slotNamesByView?: Partial<Record<ChatView, SlotLayout[] | undefined>>;

  hiddenSlotsByView?: Partial<Record<ChatView, Record<SlotLayout, boolean | undefined>>>;
  slotBindingsByView?: Partial<
    Record<ChatView, Record<SlotLayout, LayoutSlotBinding | undefined>>
  >;
  slotHistoryByView?: Partial<
    Record<ChatView, Record<SlotLayout, LayoutSlotBinding[] | undefined>>
  >;
  slotForwardHistoryByView?: Partial<
    Record<ChatView, Record<SlotLayout, LayoutSlotBinding[] | undefined>>
  >;
  slotMetaByView?: Partial<
    Record<ChatView, Record<SlotLayout, LayoutSlotMeta | undefined>>
  >;
};
```

`getLayoutViewState(state, view?)` derives active-view slot state used by ChatView consumers.

## LayoutController Contract

Implemented by `new LayoutController(...)`.

```ts
type LayoutController = {
  setSlotBinding(slot: SlotLayout, binding?: LayoutSlotBinding): void;
  setAvailableSlots(slots: SlotLayout[]): void;
  setSlotNames(slots?: SlotLayout[]): void;

  clear(slot: SlotLayout): void;
  goBack(slot: SlotLayout): void;
  goForward(slot: SlotLayout): void;

  hide(slot: SlotLayout): void;
  unhide(slot: SlotLayout): void;

  openInLayout(
    binding: LayoutSlotBinding,
    options?: { targetSlot?: SlotLayout },
  ): OpenResult;

  openView(view: ChatView, options?: { slot?: SlotLayout }): void;
  setActiveView(next: ChatView): void;

  state: StateStore<ChatViewLayoutState>;
};
```

Behavior:

1. All slot operations (`setSlotBinding`, `hide`, `goBack`, `goForward`, etc.) apply to the **active view slice** only.
2. `setActiveView`/`openView` switch only `activeView`; each view keeps its own slot state in `*ByView` stores.
3. `openInLayout` slot selection order:

- explicit `targetSlot` if valid in active view
- existing slot occupied by same `binding.payload.kind`
- first free active-view slot
- `resolveTargetSlot(...)` fallback

4. Duplicate handling is identity-key based (`binding.key`) with `allow | move | reject`.
5. Slot history and forward history are tracked **per slot, per view**.

Resolver arguments include both global state and active-view slice:

```ts
type ResolveTargetSlotArgs = {
  state: ChatViewLayoutState;
  activeViewState: ChatViewLayoutViewState;
  binding: LayoutSlotBinding;
  requestedSlot?: SlotLayout;
};
```

## ChatView Integration

`ChatView` supports:

- `maxSlots`, `minSlots`, `slotNames`
- `layoutController` override
- `resolveTargetSlot`, `duplicateEntityPolicy`, `resolveDuplicateEntity`
- `layout='nav-rail-entity-list-workspace'`
- optional fallback/renderer customization

Initialization:

- When `layoutController` is not provided, ChatView creates one.
- Initial topology is written to `channels` view slice (`availableSlotsByView.channels`, `slotNamesByView.channels`).

`ChatView.Channels` / `ChatView.Threads`:

- Accept `slots?: SlotLayout[]`.
- When the view is active, they call controller APIs to set per-view topology:
  - `setSlotNames(slots)`
  - `setAvailableSlots(slots)`
- `slots` order is the render/claim order for that view.

View switch behavior:

- `setActiveView(next)` (via `useChatViewContext`) clears `channel` and `thread` bindings in the view being left before switching.

## Navigation API (`useChatViewNavigation`)

Current API:

- `openView(view, { slot? })`
- `openChannel(channel, { slot? })`
- `closeChannel({ slot? })`
- `openThread(threadOrTarget, { slot? })`
- `closeThread({ slot? })`
- `hideChannelList({ slot? })`
- `unhideChannelList({ slot? })`

Current behavior:

1. `openChannel(...)`

- closes thread slots in active view (`closeThread()`)
- switches to `channels` view
- binds channel via `openInLayout`

2. `openThread(...)`

- opens in requested slot when provided
- otherwise opens by controller resolution
- if no free slot and topology allows expansion, appends next configured slot name

3. `closeThread({ slot? })`

- with explicit `slot`: clears only that slot
- without slot: clears deterministically resolved thread slots in active view

4. List toggle behavior is view-aware:

- channels view list kind: `channelList`
- threads view list kind: `threadList`
- list-slot hint uses `listSlotByView[activeView]`

## Slot Components and Claiming

- `ChannelListSlot`, `ThreadListSlot`, `ChannelSlot`, and `ThreadSlot` are explicit slot claimers.
- Slot visibility is internal to `Slot` (via state lookup by slot key), not parent-prop driven.
- `ThreadSlot` no longer auto-claims from another thread slot.

## Thread Interaction Behavior

- `ThreadListItemUI` opens via navigation API (`openThread`).
- Normal click targets `main-thread`.
- `Ctrl/Cmd + Click` targets `optional-thread`.
- `Thread` close button (`str-chat__close-thread-button`) closes only its owning slot:
- `ThreadSlot` provides slot context
- `Thread` calls `closeThread({ slot })`

## Built-in Layout Mode

For `layout='nav-rail-entity-list-workspace'`, ChatView renders:

1. selector rail (`ChatView.Selector`)
2. ordered workspace slots from active-view `availableSlots`
3. each slot content from current entity binding (`channelList`, `threadList`, `channel`, `thread`, etc.)
4. slot fallback when unbound

There is no dedicated internal `entityListSlot` concept.

## Serialization

`serializeLayoutState` / `restoreLayoutState` persist and restore view-scoped collections:

- `availableSlotsByView`
- `slotNamesByView`
- `hiddenSlotsByView`
- `slotBindingsByView`
- `slotHistoryByView`
- `slotForwardHistoryByView`
- `slotMetaByView`
- `listSlotByView`
- `activeView`
