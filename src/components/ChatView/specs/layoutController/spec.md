# ChatView Layout Controller Spec (proposed)

We should move all layout orchestration to `ChatView` and expose it through a typed controller-style API. `ChatContext` should no longer carry view-layout responsibilities like `openMobileNav`.

## Core principles

- `ChatView` is the single source of truth for layout/view state.
- `ChannelHeader` is presentation-first; it triggers layout actions but does not own layout state.
- External apps can choose low-level control (controller API) or high-level defaults (built-in layout policy).
- The layout controller is domain-agnostic. It should not know channel/thread/list business rules.
- Default developer experience should be simple: define `maxSlots` and let slots host any entity combination.
- Bindings should carry the data source instance (not only `id`) so outlets can render directly.

## Proposal A: Callback-only API (minimal)

- Add slot-level open/close/hide callbacks to `ChatView`.
- Keep state controlled/uncontrolled with `default*` variants.
- Pros: simple.
- Cons: scales poorly for parent-stack back navigation and deep-link restore.

## Proposal B: StateStore + commands API (reactive style)

- `ChatView` keeps internal `StateStore` state and exposes typed commands through context.
- Commands stay generic: `setActiveView`, `setMode`, `bind`, `clear`, `open`, `close`, `openView`.
- Pros: predictable transitions with reactive subscriptions and clear slot history transitions.
- Cons: requires strict state shape discipline to avoid ad-hoc store growth.

## Proposal C (recommended): LayoutController + separate DX navigation API

- `ChatView` accepts `layoutController?: LayoutController`.
- If omitted, `ChatView` creates a default controller internally.
- `ChatView` also exposes a separate high-level navigation surface (`useChatViewNavigation`) for common actions:
  - `openChannel`, `closeChannel`
  - `openThread`, `closeThread`
  - `hideChannelList`, `unhideChannelList`
  - `openView`
- `LayoutController` remains low-level and domain-agnostic.

Example API shape:

```ts
type LayoutSlot = string;
type LayoutMode = string;
type LayoutView = string;

type LayoutEntityBinding =
  | { kind: 'channelList'; source: ChannelListSource; key?: string }
  | { kind: 'channel'; source: StreamChannel; key?: string }
  | { kind: 'thread'; source: StreamThread; key?: string }
  | { kind: 'memberList'; source: StreamChannel; key?: string }
  | { kind: 'userList'; source: { query: string }; key?: string }
  | { kind: 'pinnedMessagesList'; source: StreamChannel; key?: string }
  | { kind: 'searchResults'; source: SearchResultsSource; key?: string };

type ResolveTargetSlotArgs = {
  state: ChatViewLayoutState;
  entity: LayoutEntityBinding;
  requestedSlot?: LayoutSlot;
  activeSlot?: LayoutSlot;
};

type OpenResult =
  | { status: 'opened'; slot: LayoutSlot }
  | { status: 'replaced'; slot: LayoutSlot; replaced: LayoutEntityBinding }
  | { status: 'rejected'; reason: 'no-available-slot' };

type SlotStackItem = {
  entity: LayoutEntityBinding;
  view?: LayoutView;
};

type ChatViewLayoutState = {
  mode: LayoutMode;
  activeView: LayoutView;
  activeSlot?: LayoutSlot;
  visibleSlots: LayoutSlot[];
  slotBindings: Record<LayoutSlot, LayoutEntityBinding | undefined>;
  slotMeta?: Record<LayoutSlot, { occupiedAt?: number } | undefined>;
  slotHistory: Record<LayoutSlot, SlotStackItem[] | undefined>;
  hiddenSlots: Record<LayoutSlot, boolean | undefined>;
  minSlots: number;
  maxSlots: number;
};

interface LayoutController {
  state: StateStore<ChatViewLayoutState>;
  setActiveView(next: LayoutView): void;
  setMode(next: LayoutMode): void;
  openView(
    view: LayoutView,
    options?: { slot?: LayoutSlot; pushToHistory?: boolean },
  ): void;
  bind(slot: LayoutSlot, entity?: LayoutEntityBinding): void;
  clear(slot: LayoutSlot): void;
  open(
    entity: LayoutEntityBinding,
    options?: { targetSlot?: LayoutSlot; activate?: boolean },
  ): OpenResult;
  close(slot: LayoutSlot, options?: { restoreFromHistory?: boolean }): void;
  pushParent(slot: LayoutSlot, item: SlotStackItem): void;
  popParent(slot: LayoutSlot): SlotStackItem | undefined;
  setSlotHidden(slot: LayoutSlot, hidden: boolean): void;
}

type ChatViewNavigation = {
  openChannel(channel: StreamChannel, options?: { slot?: LayoutSlot }): OpenResult;
  closeChannel(options?: { slot?: LayoutSlot }): void;
  openThread(thread: StreamThread, options?: { slot?: LayoutSlot }): OpenResult;
  closeThread(options?: { slot?: LayoutSlot }): void;
  hideChannelList(options?: { slot?: LayoutSlot }): void;
  unhideChannelList(options?: { slot?: LayoutSlot }): void;
  openView(view: LayoutView, options?: { slot?: LayoutSlot }): void;
};
```

Notes:

- `ChannelList` is a first-class slot entity (`kind: 'channelList'`), not a separate pane concept.
- Parent stack is per-slot (`slotHistory`), enabling back navigation in one-slot mobile layouts.
- Header action semantics are state-driven:
  - show back arrow when slot has parent history to pop
  - show list hide/unhide toggle when history is empty
- `minSlots` guarantees placeholders/fallback panes can remain visible before entity selection.
- Hidden slots stay mounted (`hiddenSlots`) so pagination/stateful lists are not re-initialized.
- `openView` is part of controller and navigation APIs to support URL/deep-link and cross-view transitions.
- Deep-link serialization should include view + slot history metadata, not just current bindings.

## Resolver strategies and selection flow

`layoutController.open(entity, options)` selection flow:

1. If caller provided `targetSlot`, it is forwarded as `requestedSlot`.
2. If there is a free slot, use it.
3. If no free slot, call `resolveTargetSlot({ state, entity, requestedSlot, activeSlot })`.
4. If resolver returns a slot, replace there.
5. If resolver returns `null`, return `status: 'rejected'`.

Resolver arg semantics:

- `requestedSlot`: explicit target requested by caller (`open(..., { targetSlot })`).
- `activeSlot`: currently focused pane; maintained by controller and updated on pane focus/click or `activate: true`.

Recommended built-in resolver registry:

```ts
export const layoutSlotResolvers = {
  replaceActive,
  replaceLast,
  rejectWhenFull,
  resolveTargetSlotChannelDefault,
} as const;
```

What this means:

- SDK exposes a central object with reusable slot-selection strategies.
- Integrators do not need to reimplement resolver logic for common cases.
- They can pick a predefined strategy directly, for example:

```tsx
<ChatView resolveTargetSlot={layoutSlotResolvers.resolveTargetSlotChannelDefault} />
```

Each function in this registry decides which slot to use when opening content and no free slot is available (or whenever resolver logic is needed).

Core resolver examples:

```ts
const replaceActive = ({ activeSlot, state }: ResolveTargetSlotArgs) =>
  activeSlot ?? state.visibleSlots[state.visibleSlots.length - 1] ?? null;

const replaceLast = ({ state }: ResolveTargetSlotArgs) =>
  state.visibleSlots[state.visibleSlots.length - 1] ?? null;

const rejectWhenFull = () => null;
```

`resolveTargetSlotChannelDefault` strategy (recommended for channel-centric layouts):

0. If `requestedSlot` is provided, return it and skip the resolution chain.
1. If there is a free slot, use it.
2. If opening a `thread` and no free slot, replace a slot currently occupied by a `thread`.
3. If opening a `channel` and no free slot, replace a slot currently occupied by a `thread`.
4. If no suitable thread slot exists and all occupied slots are channels, replace the earliest occupied slot.
5. Final fallback is `activeSlot` (then last visible slot).

Example:

```ts
const resolveTargetSlotChannelDefault = ({
  state,
  entity,
  requestedSlot,
  activeSlot,
}: ResolveTargetSlotArgs): LayoutSlot | null => {
  if (requestedSlot) return requestedSlot;

  const freeSlot = state.visibleSlots.find((slot) => !state.slotBindings[slot]);
  const fallback =
    activeSlot ?? state.visibleSlots[state.visibleSlots.length - 1] ?? null;
  const threadOccupiedSlot = state.visibleSlots.find(
    (slot) => state.slotBindings[slot]?.kind === 'thread',
  );
  const earliest = state.visibleSlots
    .map((slot) => ({
      occupiedAt: state.slotMeta?.[slot]?.occupiedAt ?? Number.POSITIVE_INFINITY,
      slot,
    }))
    .filter(({ occupiedAt }) => occupiedAt !== Number.POSITIVE_INFINITY)
    .sort((a, b) => a.occupiedAt - b.occupiedAt)[0]?.slot;

  if (freeSlot) return freeSlot;

  if (entity.kind === 'thread') {
    return threadOccupiedSlot ?? earliest ?? fallback;
  }

  if (entity.kind === 'channel') {
    return threadOccupiedSlot ?? earliest ?? fallback;
  }

  return earliest ?? fallback;
};
```

Same behavior can be expressed as composition of prebuilt resolver functions:

```ts
type SlotResolver = (args: ResolveTargetSlotArgs) => LayoutSlot | null;

const requestedSlotResolver: SlotResolver = ({ requestedSlot }) => requestedSlot ?? null;

const firstFree: SlotResolver = ({ state }) =>
  state.visibleSlots.find((slot) => !state.slotBindings[slot]) ?? null;

const existingThreadSlotForThread: SlotResolver = ({ state, entity }) => {
  if (entity.kind !== 'thread') return null;
  return (
    state.visibleSlots.find((slot) => state.slotBindings[slot]?.kind === 'thread') ?? null
  );
};

const existingThreadSlotForChannel: SlotResolver = ({ state, entity }) => {
  if (entity.kind !== 'channel') return null;
  return (
    state.visibleSlots.find((slot) => state.slotBindings[slot]?.kind === 'thread') ?? null
  );
};

const activeOrLast: SlotResolver = ({ state, activeSlot }) =>
  activeSlot ?? state.visibleSlots[state.visibleSlots.length - 1] ?? null;

// Requires slot metadata (e.g. occupiedAt timestamp) tracked by controller state.
const earliestOccupied: SlotResolver = ({ state }) => {
  const occupied = state.visibleSlots
    .map((slot) => ({
      occupiedAt: state.slotMeta?.[slot]?.occupiedAt ?? Number.POSITIVE_INFINITY,
      slot,
    }))
    .filter(({ occupiedAt }) => occupiedAt !== Number.POSITIVE_INFINITY)
    .sort((a, b) => a.occupiedAt - b.occupiedAt);
  return occupied[0]?.slot ?? null;
};

const composeResolvers =
  (...resolvers: SlotResolver[]): SlotResolver =>
  (args) => {
    for (const resolve of resolvers) {
      const slot = resolve(args);
      if (slot) return slot;
    }
    return null;
  };

export const resolveTargetSlotChannelDefault = composeResolvers(
  requestedSlotResolver,
  firstFree,
  existingThreadSlotForThread,
  existingThreadSlotForChannel,
  earliestOccupied,
  activeOrLast,
);
```

Recommended central export:

```ts
export const layoutSlotResolvers = {
  requestedSlotResolver,
  firstFree,
  existingThreadSlotForThread,
  existingThreadSlotForChannel,
  earliestOccupied,
  activeOrLast,
  replaceActive,
  replaceLast,
  rejectWhenFull,
  resolveTargetSlotChannelDefault,
  composeResolvers,
} as const;
```

## Simplified DX mode (recommended default)

Most developers should only configure:

- `minSlots` and `maxSlots`
- placement policy (`fill-empty-then-replace-last`, `replace-active`, etc.)
- initial entities (commonly `channelList` + fallback workspace slot)

Example:

```tsx
<ChatView minSlots={2} maxSlots={2} placement='fill-empty-then-replace-last'>
  <WorkspaceLayout />
</ChatView>
```

`placement` can be treated as shorthand that internally maps to `resolveTargetSlot`.

## Two-step DX mode (preferred integrator flow)

To avoid requiring custom `DynamicSlotsLayout` + `SlotOutlet`, provide a built-in workspace renderer.

Step 1: declare top-level ChatView layout shell.

Step 2: provide slot binding render config (by `kind`) and optional per-slot fallbacks.

```tsx
<ChatView
  minSlots={2}
  maxSlots={3}
  layout='nav-rail-workspace'
  placement='fill-empty-then-replace-last'
  slotRenderers={{
    channelList: ({ source }) => <ChannelList {...source} />,
    channel: ({ source }) => <Channel channel={source} />,
    thread: ({ source }) => (
      <ChatView.ThreadProvider thread={source}>
        <Thread />
      </ChatView.ThreadProvider>
    ),
    memberList: ({ source }) => <MemberList channel={source} />,
    userList: ({ source }) => <UserList query={source.query} />,
    pinnedMessagesList: ({ source }) => <PinnedMessagesList channel={source} />,
    searchResults: ({ source }) => <SearchResults {...source} />,
  }}
  slotFallbacks={{
    workspace: <EmptyChannelWorkspacePrompt />,
  }}
/>
```

This keeps integration to two steps while preserving advanced escape hatches.

Advanced mode remains available:

- Provide custom children/layout render function when app needs full control.
- In that case integrator may still implement custom `DynamicSlotsLayout` and `SlotOutlet`.

Example (advanced mode): render `DynamicSlotsLayout` as `ChatView` children.

```tsx
const ChatShell = () => (
  <ChatView
    minSlots={2}
    maxSlots={3}
    resolveTargetSlot={layoutSlotResolvers.resolveTargetSlotChannelDefault}
  >
    <div className='app-shell'>
      <NavRail />
      <DynamicSlotsLayout />
    </div>
  </ChatView>
);
```

Advanced mode: `DynamicSlotsLayout` renders generic slot outlets:

```tsx
import { useStateStore } from '../../store';

const DynamicSlotsLayout = () => {
  const { layoutController } = useChatViewContext();
  const { visibleSlots } = useStateStore(layoutController.state);
  return (
    <div className='my-layout my-layout--3col'>
      {visibleSlots.map((slot) => (
        <SlotOutlet key={slot} slot={slot} />
      ))}
    </div>
  );
};
```

And each `SlotOutlet` switches by `entity.kind` and uses `entity.source` directly:

```tsx
const SlotOutlet = ({ slot }: { slot: string }) => {
  const { layoutController } = useChatViewContext();
  const { slotBindings } = useStateStore(layoutController.state);
  const entity = slotBindings[slot];
  if (!entity) return null;

  switch (entity.kind) {
    case 'channel':
      return <Channel channel={entity.source} />;
    case 'thread':
      return (
        <ChatView.ThreadProvider thread={entity.source}>
          <Thread />
        </ChatView.ThreadProvider>
      );
    case 'memberList':
      return <MemberList channel={entity.source} />;
    case 'userList':
      return <UserList query={entity.source.query} />;
    case 'pinnedMessagesList':
      return <PinnedMessagesList channel={entity.source} />;
    default:
      return null;
  }
};
```

## Viewing duplicate entities

This section defines how layout should behave when a user opens an entity that is already visible in one of the slots.
Without explicit rules, repeat-open actions can feel inconsistent (sometimes duplicate, sometimes move, sometimes no-op).

Controller can support one of these policies using `entity.key`:

- `allow`: same entity may appear in multiple slots.
- `move`: if entity already exists, move it to target slot.
- `reject`: ignore/throw when trying to duplicate.

Configuration:

- `duplicateEntityPolicy`: global default (`'allow' | 'move' | 'reject'`).
- `resolveDuplicateEntity`: optional per-open resolver override (receives state + context).

Example:

```tsx
<ChatView
  maxSlots={3}
  duplicateEntityPolicy='move'
  resolveDuplicateEntity={({ entity }) => (entity.kind === 'thread' ? 'move' : 'reject')}
/>
```

```ts
const identity = entity.key;
const existing = identity ? findSlotByKey(identity) : undefined;
const policy =
  existing && resolveDuplicateEntity
    ? resolveDuplicateEntity({
        state,
        entity,
        existingSlot: existing,
        requestedSlot,
        activeSlot,
      })
    : duplicateEntityPolicy;
if (policy === 'move' && existing) clear(existing);
if (policy === 'reject' && existing) return existing;
bind(targetSlot, entity);
```

## ChatView context contract (with controller)

- `useChatViewContext()` returns:
  - `layoutController` (low-level API)
  - `navigation` from `useChatViewNavigation()` (high-level API)
- Layout state is consumed through `layoutController.state` and `useStateStore(...)`.
- `str-chat__header-sidebar-toggle` click behavior:
  - default: if current slot has parent history, pop parent (back)
  - otherwise hide/unhide channel-list slot
  - optional override in `ChannelHeader` via `onSidebarToggle`
- `ChannelHeader` icon is derived from layout state:
  - show back arrow when `slotHistory[currentSlot]?.length > 0`
  - show sidebar/list icon when history is empty

## ChannelList and slot counting

Recommended default:

- Treat `ChannelList` as a regular slot entity.
- Keep `navRail` outside slots (if present), but all list/content panes are slots.
- `minSlots` controls guaranteed visible slot count (including fallback-only slots).
- `maxSlots` controls upper bound of concurrently active slots.

Example layout with `minSlots={2}`, `maxSlots={3}`:

- `navRail | slot1(channelList) | slot2(channel-or-fallback) | slot3(optional)`

One-slot mobile layout:

- `minSlots={1}`, `maxSlots={1}`
- active slot transitions: `channelList -> channel -> thread`
- back action pops slot parent stack: `thread -> channel -> channelList`

## Slot visibility and mount lifecycle

To preserve pagination and long-lived list state, hiding a slot must not unmount it.

Recommended primitive:

```tsx
type SlotProps = {
  slot: LayoutSlot;
  keepMounted?: boolean;
};

const Slot = ({ slot, keepMounted = true }: SlotProps) => {
  const { layoutController } = useChatViewContext();
  const { hiddenSlots } = useStateStore(layoutController.state);
  const isHidden = !!hiddenSlots[slot];

  return (
    <section
      className={clsx('str-chat__slot', {
        'str-chat__slot--hidden': isHidden,
        'str-chat__slot--visible': !isHidden,
      })}
      data-slot={slot}
    >
      <SlotOutlet slot={slot} />
    </section>
  );
};
```

`str-chat__slot--hidden` should be CSS-hidden while still mounted.

## Deep-linking and serialization

Navigation should be serializable with an SDK-level helper interface.

```ts
type SerializedLayout = {
  activeView: LayoutView;
  activeSlot?: LayoutSlot;
  slots: Array<{
    slot: LayoutSlot;
    entity?: { key?: string; kind: LayoutEntityBinding['kind'] };
    hidden?: boolean;
    parents?: Array<{
      key?: string;
      kind: LayoutEntityBinding['kind'];
      view?: LayoutView;
    }>;
  }>;
};

interface LayoutSerializationAdapter {
  serialize(state: ChatViewLayoutState): SerializedLayout;
  restore(serialized: SerializedLayout): Promise<void>;
}
```

`openView` is the canonical entry point for applying route/view changes from deep links before opening concrete entities.

## TSX example: dynamic 3-slot layout (any combination)

```tsx
import React from 'react';
import { ChatView, useChatViewContext } from './ChatView';
import { Channel } from '../Channel';
import { Thread } from '../Thread';
import { MemberList, UserList, PinnedMessagesList } from '../Lists';
import type { Channel as StreamChannel, Thread as StreamThread } from 'stream-chat';
import { useStateStore } from '../../store';

const SlotOutlet = ({ slot }: { slot: string }) => {
  const { layoutController } = useChatViewContext();
  const { slotBindings } = useStateStore(layoutController.state);
  const entity = slotBindings[slot];
  if (!entity) return null;

  switch (entity.kind) {
    case 'channel':
      return <Channel channel={entity.source} />;
    case 'thread':
      return (
        <ChatView.ThreadProvider thread={entity.source}>
          <Thread />
        </ChatView.ThreadProvider>
      );
    case 'memberList':
      return <MemberList channel={entity.source} />;
    case 'userList':
      return <UserList query={entity.source.query} />;
    case 'pinnedMessagesList':
      return <PinnedMessagesList channel={entity.source} />;
    default:
      return null;
  }
};

const DynamicThreePaneLayout = () => {
  const { layoutController } = useChatViewContext();
  const { visibleSlots } = useStateStore(layoutController.state);
  return (
    <div className='my-layout my-layout--3col'>
      {visibleSlots.map((slot) => (
        <section key={slot} className='my-layout__pane'>
          <SlotOutlet slot={slot} />
        </section>
      ))}
    </div>
  );
};

export const Example = ({
  channelA,
  channelB,
  threadA,
}: {
  channelA: StreamChannel;
  channelB: StreamChannel;
  threadA: StreamThread;
}) => (
  <ChatView maxSlots={3} placement='fill-empty-then-replace-last'>
    <LayoutBootstrap channelA={channelA} channelB={channelB} threadA={threadA} />
    <DynamicThreePaneLayout />
  </ChatView>
);

const LayoutBootstrap = ({
  channelA,
  channelB,
  threadA,
}: {
  channelA: StreamChannel;
  channelB: StreamChannel;
  threadA: StreamThread;
}) => {
  const { layoutController } = useChatViewContext();

  React.useEffect(() => {
    layoutController.open({ kind: 'channel', source: channelA, key: channelA.cid });
    layoutController.open({ kind: 'channel', source: channelB, key: channelB.cid });
    layoutController.open({ kind: 'thread', source: threadA, key: threadA.id });
  }, [channelA, channelB, layoutController, threadA]);

  return null;
};
```

## Slot binding scenarios (documentation examples)

### 1) Source of truth: where outlets get data

All outlets read from `layoutController.state` (`slotBindings`) in `ChatView` context.
Example snapshot:

```ts
{
  slot1: { kind: 'channel', source: channelGeneral, key: channelGeneral.cid },
  slot2: { kind: 'thread', source: thread101, key: thread101.id },
  slot3: { kind: 'channel', source: channelSupport, key: channelSupport.cid },
}
```

### 2) Multiple channels side-by-side

```ts
layoutController.bind('slot1', {
  kind: 'channel',
  source: channelGeneral,
  key: channelGeneral.cid,
});
layoutController.bind('slot2', {
  kind: 'channel',
  source: channelSupport,
  key: channelSupport.cid,
});
layoutController.bind('slot3', {
  kind: 'channel',
  source: channelRandom,
  key: channelRandom.cid,
});
```

### 3) Mixed layout: channel + thread + pinned list

```ts
layoutController.bind('slot1', {
  kind: 'channel',
  source: channelGeneral,
  key: channelGeneral.cid,
});
layoutController.bind('slot2', { kind: 'thread', source: thread101, key: thread101.id });
layoutController.bind('slot3', {
  kind: 'pinnedMessagesList',
  source: channelGeneral,
  key: `pinned:${channelGeneral.cid}`,
});
```

### 4) User action flow: channel list click -> open in next slot

```tsx
const ChannelListItem = ({ channel }: { channel: StreamChannel }) => {
  const { openChannel } = useChatViewNavigation();
  return <button onClick={() => openChannel(channel)}>Open channel</button>;
};
```

### 5) User action flow: thread click -> open in next slot

```tsx
const ThreadListItem = ({ thread }: { thread: StreamThread }) => {
  const { openThread } = useChatViewNavigation();
  return <button onClick={() => openThread(thread)}>Open thread</button>;
};
```

### 6) View switch flow: from `threads` view to opening an arbitrary channel

Scenario:

- User is currently in `activeView='threads'`.
- User clicks a message-annotation action in a thread item
  (for example: "View reply in channel" / "This reply was also sent to channel").
- Expected outcome:
  - channel opens in a workspace slot (via resolver chain),
  - `activeView` switches to `'channels'`,
  - channel-list slot is restored/shown when required by view policy.

```tsx
const ViewReplyInChannelAction = ({ channel }: { channel: StreamChannel }) => {
  const { openChannel, openView } = useChatViewNavigation();

  const onViewInChannel = () => {
    openView('channels');
    openChannel(channel, { slot: 'workspace' });
  };

  return <button onClick={onViewInChannel}>View in channel</button>;
};
```

If `resolveTargetSlotChannelDefault` is used, slot decision still follows the same chain:

1. honor `targetSlot` if provided
2. else use free slot
3. else replace thread slot (for channel entity)
4. else replace earliest occupied
5. else fallback to active/last slot

### 7) Persistence note

Motivation:

- `slotBindings` store in-memory instances (`source`), which cannot be safely persisted to URL/localStorage/session storage.
- After refresh/navigation/app restart, those instances do not exist anymore.
- To restore user workspace reliably, persist only serializable identifiers (`entity.key`) and rebuild instances on restore.

What this solves:

- Users return to the same multi-pane layout after refresh.
- Deep links can reproduce slot arrangement.
- Persistence stays stable across runtime boundaries (tabs/sessions/process restarts).

Recommended flow:

1. Persist a compact snapshot: slot -> `entity.key` (+ optionally `kind`/`activeView`).
2. On restore, resolve each key back to a live instance (channel/thread/etc.).
3. Rebind resolved instances into slots using `layoutController.bind(...)` and restore `slotHistory`.
4. Skip entries that cannot be resolved (deleted channel, revoked access, etc.).

Example:

```ts
// persist
const serialized = Object.fromEntries(
  Object.entries(layoutController.state.getLatestValue().slotBindings).map(
    ([slot, entity]) => [slot, entity ? { key: entity.key, kind: entity.kind } : null],
  ),
);

// restore
const slot1 = serialized.slot1;
if (slot1?.kind === 'channel') {
  const channel = resolveChannel(slot1.key);
  if (channel) {
    layoutController.bind('slot1', { kind: 'channel', source: channel, key: slot1.key });
  }
}
```

## Suggested migration path

1. Keep low-level `LayoutController` in `ChatView` context backed by `StateStore`.
2. Add per-slot parent stack and back-pop transitions (`pushParent`/`popParent`) for one-slot/mobile workflows.
3. Move `ChannelList` into slot model (`kind: 'channelList'`) and remove dedicated entity-list-pane semantics.
4. Add `minSlots` + fallback slot rendering for pre-selection states.
5. Add mount-preserving slot hiding (`hiddenSlots` + `Slot` CSS class contract).
6. Add `openView` and layout serialization adapter for deep-link/navigation restore.
7. Add `useChatViewNavigation()` and move high-level domain methods there.

## Summary

- Recommended design: pass a generic `LayoutController` (or use default one) through `ChatView` and expose it in `ChatView` context.
- Keep `LayoutController` low-level and domain-agnostic; expose domain navigation via `useChatViewNavigation()`.
- Bindings should carry source instances so outlets render directly without extra lookup.
- Optional `key` handles deduplication and persistence.
- `ChannelList` is a slot entity, enabling one-slot mobile flows and list replacement (e.g. search results) in the same slot.
- `minSlots` and slot fallbacks provide stable empty-state layouts before entity selection.
