// Per-kind slot policy. Each registered `kind` declares how it renders (`Component`) and the policy
// the navigation layer reads: `persistent` (nav-rail lists that `hide` rather than `close`) and
// `view` (the ChatView a newly opened kind belongs to).

import React, { createContext, useContext } from 'react';

import { ChannelNavigation } from '../../components/ChannelList';
import { ThreadList } from '../../components/Threads/ThreadList';

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
   * Pure renderer for this kind: it does not claim slots or read layout state. A kind may declare
   * only policy and leave rendering to the app's `slotRenderers` (e.g. `channel`).
   */
  Component?: (props: ChatViewSlotRendererProps<TKind>) => ReactNode;
  /**
   * Marks nav-rail lists: navigation hides and unhides them but never closes or releases them, and
   * default slot resolution never picks them for a binding of another kind.
   */
  persistent?: boolean;
  /**
   * ChatView that opening a binding of this kind switches to. Without it, the binding opens in the
   * active view.
   */
  view?: ChatView;
};

export type SlotKindRegistry = Partial<{
  [TKind in ChatViewEntityKind]: SlotKindDefinition<TKind>;
}>;

/** Built-in renderer of the `userProfile` kind: the user ID in a `<div>`. */
const SlotUserProfile = ({ userId }: { userId: string }) => (
  <div className='str-chat__chat-view__slot-user-profile' data-user-id={userId}>
    {userId}
  </div>
);

export const defaultSlotKindRegistry: SlotKindRegistry = {
  // `channel` declares only policy; its renderer comes from the `slotRenderers` prop (see
  // `resolveSlotKindRegistry`).
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

/** Merges the app's `slotRenderers` into a registry, replacing only each kind's `Component`. */
export const resolveSlotKindRegistry = (
  slotRenderers?: ChatViewSlotRenderers,
  base: SlotKindRegistry = defaultSlotKindRegistry,
): SlotKindRegistry => {
  if (!slotRenderers) return base;
  const merged: SlotKindRegistry = { ...base };
  (Object.keys(slotRenderers) as ChatViewEntityKind[]).forEach((kind) => {
    const Component = slotRenderers[kind];
    if (!Component) return;
    // TS cannot express a correlated union across a keyed record; each key and value kind match.
    (merged as Record<string, SlotKindDefinition<ChatViewEntityKind>>)[kind] = {
      ...(base[kind] as SlotKindDefinition<ChatViewEntityKind> | undefined),
      Component: Component as SlotKindDefinition<ChatViewEntityKind>['Component'],
    };
  });
  return merged;
};

/**
 * Whether a slot's content renders anything. React renders nothing for `null`, `undefined` and
 * booleans, so a renderer returning `false` (as `condition && <View />` does) leaves the slot
 * empty.
 */
export const hasSlotContent = (content: ReactNode) =>
  content != null && typeof content !== 'boolean';

/**
 * Renders the registered `Component` of the entity's kind. A missing entity, an unregistered kind
 * or a kind without a `Component` render nothing, leaving any fallback to the caller.
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

/** Whether `kind` is registered as persistent (see {@link SlotKindDefinition.persistent}). */
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
