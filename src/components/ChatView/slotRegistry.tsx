// Renderer registry: the single home for per-kind slot policy.
// Each registered `kind` declares how it renders (`Component`) plus the policy
// the navigation layer reads — `persistent` (nav-rail lists that `hide` rather
// than `close`) and `view` (which ChatView a freshly-opened kind belongs to).
//
// `Component`, `persistent`, and `view` are all consumed by later steps:
//   - `Component` here in step 5 (generic <Slot> self-lookup);
//   - `persistent` in step 7 (replaces the interim `isListEntityKind` set);
//   - `view` in step 6 (kind -> view coupling for the generic `open`).

import React, { createContext, useContext } from 'react';

import { ChannelNavigation } from '../ChannelList';
import { ThreadList } from '../Threads/ThreadList';

import type { ReactNode } from 'react';
import type { ChatView } from './ChatView';
import type {
  ChatViewEntityBinding,
  ChatViewEntityKind,
  ChatViewSlotRendererProps,
  ChatViewSlotRenderers,
} from './slotBinding';

export type SlotKindDefinition<TKind extends ChatViewEntityKind> = {
  /**
   * Pure renderer for this kind — no slot claiming, no layout-state reads.
   * Optional: a kind may declare only policy (`view`/`persistent`) and leave the
   * renderer to the app's `slotRenderers` prop (e.g. `channel`/`thread`).
   */
  Component?: (props: ChatViewSlotRendererProps<TKind>) => ReactNode;
  /**
   * Persistent kinds (nav-rail lists) are `hide`/`unhide`-only: the resolver
   * never overwrites them and `close` does not apply. Transient kinds
   * (channel/thread/profile) are `close`-able and may be replaced. Consumed by
   * step 7.
   */
  persistent?: boolean;
  /** ChatView this kind belongs to; consumed by the generic `open` in step 6. */
  view?: ChatView;
};

export type SlotKindRegistry = Partial<{
  [TKind in ChatViewEntityKind]: SlotKindDefinition<TKind>;
}>;

/** Minimal built-in renderer for the `userProfile` demo kind — proves the
 * registry can render arbitrary UI in a slot, not just channel/thread/list. */
const SlotUserProfile = ({ userId }: { userId: string }) => (
  <div className='str-chat__chat-view__slot-user-profile' data-user-id={userId}>
    {userId}
  </div>
);

export const defaultSlotKindRegistry: SlotKindRegistry = {
  // `channel`/`thread` declare only policy; their renderer is app-supplied via
  // the `slotRenderers` prop (folded in by `resolveSlotKindRegistry`).
  channel: { view: 'channels' },
  channelList: {
    Component: () => <ChannelNavigation />,
    persistent: true,
  },
  threadList: {
    Component: () => <ThreadList />,
    persistent: true,
  },
  userProfile: {
    Component: ({ source }) => <SlotUserProfile userId={source.userId} />,
  },
};

/** Fold the app's `slotRenderers` prop into a registry, overriding only each
 * kind's `Component` while preserving the built-in policy (`persistent`/`view`). */
export const resolveSlotKindRegistry = (
  slotRenderers?: ChatViewSlotRenderers,
  base: SlotKindRegistry = defaultSlotKindRegistry,
): SlotKindRegistry => {
  if (!slotRenderers) return base;
  const merged: SlotKindRegistry = { ...base };
  (Object.keys(slotRenderers) as ChatViewEntityKind[]).forEach((kind) => {
    const Component = slotRenderers[kind];
    if (!Component) return;
    // Correlated-union assignment across a keyed record is not expressible to
    // TS here; the key/value kinds are guaranteed to match by construction.
    (merged as Record<string, SlotKindDefinition<ChatViewEntityKind>>)[kind] = {
      ...(base[kind] as SlotKindDefinition<ChatViewEntityKind> | undefined),
      Component: Component as SlotKindDefinition<ChatViewEntityKind>['Component'],
    };
  });
  return merged;
};

/**
 * State-aware dispatch for a slot's current binding. Looks up the bound kind in
 * the registry and renders its pure `Component`; unknown/unregistered kinds and
 * empty slots render nothing (the caller supplies a fallback).
 */
export const renderSlotFromRegistry = (
  entity: ChatViewEntityBinding | undefined,
  slot: string,
  registry: SlotKindRegistry,
): ReactNode | null => {
  if (!entity) return null;
  const definition = registry[entity.kind];
  if (!definition?.Component) return null;
  const Component = definition.Component as (props: {
    entity: ChatViewEntityBinding;
    slot: string;
    source: ChatViewEntityBinding['source'];
  }) => ReactNode;
  return Component({ entity, slot, source: entity.source });
};

/** Per-kind policy readers used by the navigation layer (D6). */
export const isPersistentSlotKind = (
  registry: SlotKindRegistry,
  kind?: ChatViewEntityKind,
): boolean => !!kind && !!registry[kind]?.persistent;

export const resolveSlotKindView = (
  registry: SlotKindRegistry,
  kind: ChatViewEntityKind,
): ChatView | undefined => registry[kind]?.view;

export const SlotRegistryContext = createContext<SlotKindRegistry>(
  defaultSlotKindRegistry,
);

export const useSlotRegistry = () => useContext(SlotRegistryContext);
