import React, { useMemo } from 'react';

import { useChatContext } from '../../context';
import { WorkspaceNavigationProvider } from '../../context/WorkspaceNavigationContext';
import {
  createThreadEntityBinding,
  useChatViewNavigation,
} from './ChatViewNavigationContext';
import { getChatViewEntityBinding, useChatViewContext } from './ChatView';
import { useLayoutViewState } from './hooks/useLayoutViewState';
import { isPersistentSlotKind, useSlotRegistry } from './slotRegistry';

import type { PropsWithChildren } from 'react';
import type { Channel as StreamChannel, Thread as StreamThread } from 'stream-chat';
import { Thread as StreamThreadClass } from 'stream-chat';
import type { WorkspaceNavigation } from '../../context/WorkspaceNavigationContext';
import type { ChatViewEntityBinding } from './ChatView';

/**
 * Overrides members of the {@link WorkspaceNavigation} that ChatView derives, e.g. to open channels
 * beside the current content on cmd/ctrl-click. Receives the derived navigation as `base`, to
 * delegate to, and returns the members to replace; members left out or `undefined` keep the
 * default. Must be referentially stable (wrap in `useCallback`): it is a dependency of the
 * adapter's `useMemo`.
 */
export type DeriveWorkspaceNavigation = (
  base: WorkspaceNavigation,
) => Partial<WorkspaceNavigation>;

export type WorkspaceNavigationAdapterProps = {
  deriveWorkspaceNavigation?: DeriveWorkspaceNavigation;
};

/**
 * Implements {@link WorkspaceNavigation} over the ChatView slot state and provides it to the
 * subtree. Must render inside `ChatViewNavigationProvider` (it drives `open`, `close` and
 * `release`) and the ChatView context. `deriveWorkspaceNavigation` overrides members; the rest
 * stay as derived here.
 */
export const WorkspaceNavigationAdapter = ({
  children,
  deriveWorkspaceNavigation,
}: PropsWithChildren<WorkspaceNavigationAdapterProps>) => {
  const { close, open, release } = useChatViewNavigation();
  const registry = useSlotRegistry();
  const { activeView } = useChatViewContext();
  const { client } = useChatContext();
  const { availableSlots, slotBindings, slotLayers } = useLayoutViewState();

  const value = useMemo<WorkspaceNavigation>(() => {
    const bindingOf = (slot: string) => getChatViewEntityBinding(slotBindings[slot]);
    // The slot whose base binding has entity `key`, found as `useSlotForKey` does.
    const slotOfKey = (key?: string) =>
      key === undefined
        ? undefined
        : availableSlots.find((slot) => bindingOf(slot)?.key === key);
    // The first slot holding a thread, found as `useSlotForKind('thread')` does.
    const activeThreadSlot = availableSlots.find(
      (slot) => bindingOf(slot)?.kind === 'thread',
    );
    // What a slot shows: its top layer when something is stacked over the base, else the base.
    const visibleBindingOf = (slot: string) => {
      const layers = slotLayers?.[slot];
      return layers?.length
        ? getChatViewEntityBinding(layers[layers.length - 1])
        : bindingOf(slot);
    };
    // An entity opened into an occupied slot is stacked as a layer, so look at each slot's top
    // layer, not only its base binding.
    const slotShowingKey = (key: string) =>
      availableSlots.find((slot) => visibleBindingOf(slot)?.key === key);
    const slotShowingThread = availableSlots.find(
      (slot) => visibleBindingOf(slot)?.kind === 'thread',
    );
    // Slots showing a channel, in layout order: the first is the primary channel panel, any later
    // one is a channel opened beside it.
    const slotsShowingChannel = availableSlots.filter(
      (slot) => visibleBindingOf(slot)?.kind === 'channel',
    );
    // The first slot not holding a nav-rail list: the workspace's main panel.
    const primarySlot = availableSlots.find(
      (slot) => !isPersistentSlotKind(registry, bindingOf(slot)?.kind),
    );
    // Closing a panel beside the main one dismisses it whole, with whatever is stacked in it; the
    // main panel only ever steps back one layer, so it is never emptied from under the workspace.
    const dismissSlot = (slot: string) =>
      slot === primarySlot ? close(slot) : release(slot);
    const hasContentBeneath = (slot?: string) => !!slot && !!slotLayers?.[slot]?.length;
    // The slot an entity is shown in. The same channel or thread can be open in several; the
    // caller's own panel (a slot, see `WorkspacePanelProvider`) settles which one is meant.
    const slotShowing = (key?: string, panel?: string) => {
      if (key === undefined) return undefined;
      if (
        panel &&
        availableSlots.includes(panel) &&
        visibleBindingOf(panel)?.key === key
      ) {
        return panel;
      }
      return slotShowingKey(key);
    };

    const openChannels = availableSlots.reduce<StreamChannel[]>((acc, slot) => {
      const binding = bindingOf(slot);
      if (binding?.kind === 'channel') acc.push(binding.source);
      return acc;
    }, []);
    const openThreads = availableSlots.reduce<StreamThread[]>((acc, slot) => {
      const binding = bindingOf(slot);
      if (binding?.kind === 'thread') acc.push(binding.source);
      return acc;
    }, []);

    const isThreadsView = activeView === 'threads';

    return {
      canGoBack: (key, panel) => hasContentBeneath(slotShowing(key, panel)),
      closeChannel: (cid, options) => {
        const slot = slotShowing(cid, options?.panel);
        if (slot) dismissSlot(slot);
      },
      closeThread: (threadId, options) => {
        // The slot showing `threadId`; falls back to the first thread slot when it is unset or
        // not found.
        const slot =
          (threadId === undefined
            ? undefined
            : options?.panel
              ? slotShowing(threadId, options.panel)
              : (slotOfKey(threadId) ?? slotShowingKey(threadId))) ??
          activeThreadSlot ??
          slotShowingThread;
        if (slot) dismissSlot(slot);
      },
      goBack: (key, options) => {
        const slot = slotShowing(key, options?.panel);
        // `close` pops the top layer (the entity shown), revealing what it is stacked over.
        if (hasContentBeneath(slot)) close(slot as string);
      },
      // Active = shown: a channel covered by another panel stacked in its slot is not.
      isChannelActive: (cid) => cid !== undefined && !!slotShowingKey(cid),
      isChannelDismissable: (cid, panel) => {
        const slot = slotShowing(cid, panel);
        return !!slot && slotsShowingChannel.indexOf(slot) > 0;
      },
      isThreadActive: (threadId) =>
        threadId !== undefined &&
        availableSlots.some((slot) => {
          const binding = visibleBindingOf(slot);
          return binding?.kind === 'thread' && binding.source.id === threadId;
        }),
      isThreadDismissable: (threadId, panel) => {
        // Reply threads in any non-threads view are closable; in the threads view only a secondary
        // thread (one not occupying the view's primary thread slot) is closable.
        if (!isThreadsView) return true;
        const slot = panel
          ? slotShowing(threadId, panel)
          : threadId === undefined
            ? undefined
            : slotOfKey(threadId);
        return !!slot && !!activeThreadSlot && slot !== activeThreadSlot;
      },
      isThreadsView,
      openChannel: (channel, options) => {
        void open(
          { key: channel.cid ?? undefined, kind: 'channel', source: channel },
          options,
        );
      },
      openChannels,
      openThread: (target, options) => {
        const binding: ChatViewEntityBinding =
          target instanceof StreamThreadClass
            ? { key: target.id ?? undefined, kind: 'thread', source: target }
            : createThreadEntityBinding(client, target);
        void open(binding, options);
      },
      openThreads,
    };
  }, [
    activeView,
    availableSlots,
    client,
    close,
    open,
    registry,
    release,
    slotBindings,
    slotLayers,
  ]);

  const derived = useMemo<WorkspaceNavigation>(() => {
    if (!deriveWorkspaceNavigation) return value;
    // A member set to `undefined` keeps the default rather than removing it.
    const overrides = Object.fromEntries(
      Object.entries(deriveWorkspaceNavigation(value)).filter(
        ([, member]) => member !== undefined,
      ),
    );
    return { ...value, ...overrides };
  }, [deriveWorkspaceNavigation, value]);

  return (
    <WorkspaceNavigationProvider value={derived}>{children}</WorkspaceNavigationProvider>
  );
};
