import React, { useMemo } from 'react';

import { useChatContext } from '../../context';
import { WorkspaceNavigationProvider } from '../../context/WorkspaceNavigationContext';
import {
  createThreadEntityBinding,
  useChatViewNavigation,
} from './ChatViewNavigationContext';
import { getChatViewEntityBinding, useChatViewContext } from './ChatView';
import { useLayoutViewState } from './hooks/useLayoutViewState';

import type { PropsWithChildren } from 'react';
import type { Channel as StreamChannel, Thread as StreamThread } from 'stream-chat';
import { Thread as StreamThreadClass } from 'stream-chat';
import type { WorkspaceNavigation } from '../../context/WorkspaceNavigationContext';
import type { ChatViewEntityBinding } from './ChatView';

/**
 * Optional transform an app supplies (via `ChatView`) to customize the derived
 * {@link WorkspaceNavigation} — e.g. make `openChannel`/`openThread` open *beside* the current
 * content on ⌘/ctrl-click. Receives the fully-derived navigation and returns the one to provide;
 * spread the base and override only the methods you care about. Must be referentially stable
 * (wrap in `useCallback`) — it participates in the adapter's `useMemo`.
 */
export type DeriveWorkspaceNavigation = (
  base: WorkspaceNavigation,
) => WorkspaceNavigation;

export type WorkspaceNavigationAdapterProps = {
  deriveWorkspaceNavigation?: DeriveWorkspaceNavigation;
};

/**
 * Implements the core-owned {@link WorkspaceNavigation} abstraction (D1) over the ChatView slot
 * system and provides it to the subtree. Rendered inside `ChatViewNavigationProvider` (so it can
 * drive `open`/`close`) and the ChatView context (so it can read the active view's slot state).
 *
 * Every read/operation is derived from the same slot primitives the ChatView hooks use, so core
 * consumers routed through the adapter behave exactly as they did calling the slot API directly.
 * An app may pass `deriveWorkspaceNavigation` to override individual operations (e.g. additive
 * open on ⌘/ctrl-click) without re-implementing the adapter.
 */
export const WorkspaceNavigationAdapter = ({
  children,
  deriveWorkspaceNavigation,
}: PropsWithChildren<WorkspaceNavigationAdapterProps>) => {
  const { close, open } = useChatViewNavigation();
  const { activeView } = useChatViewContext();
  const { client } = useChatContext('WorkspaceNavigationAdapter');
  const { availableSlots, slotBindings } = useLayoutViewState();

  const value = useMemo<WorkspaceNavigation>(() => {
    const bindingOf = (slot: string) => getChatViewEntityBinding(slotBindings[slot]);
    // The slot (in the active view) whose base binding carries entity `key` — mirrors `useSlotForKey`.
    const slotOfKey = (key?: string) =>
      key === undefined
        ? undefined
        : availableSlots.find((slot) => bindingOf(slot)?.key === key);
    // First slot holding a thread — mirrors `useSlotForKind('thread')`.
    const activeThreadSlot = availableSlots.find(
      (slot) => bindingOf(slot)?.kind === 'thread',
    );

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
      closeThread: (threadId) => {
        // Mirror `closableThreadSlot = threadSlot ?? activeThreadSlot` from the previous Thread wiring.
        const slot =
          (threadId === undefined ? undefined : slotOfKey(threadId)) ?? activeThreadSlot;
        if (slot) close(slot);
      },
      isChannelActive: (cid) => !!slotOfKey(cid),
      isThreadActive: (threadId) =>
        threadId !== undefined &&
        availableSlots.some((slot) => {
          const binding = bindingOf(slot);
          return binding?.kind === 'thread' && binding.source.id === threadId;
        }),
      isThreadDismissable: (threadId) => {
        // Reply threads in any non-threads view are closable; in the threads view only a secondary
        // thread (one not occupying the view's primary thread slot) is closable.
        if (!isThreadsView) return true;
        const slot = threadId === undefined ? undefined : slotOfKey(threadId);
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
  }, [activeView, availableSlots, client, close, open, slotBindings]);

  const derived = useMemo(
    () => (deriveWorkspaceNavigation ? deriveWorkspaceNavigation(value) : value),
    [deriveWorkspaceNavigation, value],
  );

  return (
    <WorkspaceNavigationProvider value={derived}>{children}</WorkspaceNavigationProvider>
  );
};
