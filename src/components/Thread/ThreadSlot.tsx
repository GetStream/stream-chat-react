import React from 'react';

import { getChatViewEntityBinding, useChatViewContext } from '../ChatView';
import { useStateStore } from '../../store';
import { ThreadProvider } from '../Threads';
import { Thread as ThreadComponent, type ThreadProps } from './Thread';

import type { PropsWithChildren, ReactNode } from 'react';
import type { Thread as StreamThread } from 'stream-chat';
import type {
  ChatViewLayoutState,
  LayoutSlot,
} from '../ChatView/layoutController/layoutControllerTypes';

export type ThreadSlotProps = PropsWithChildren<
  ThreadProps & {
    fallback?: ReactNode;
    slot?: LayoutSlot;
  }
>;

const threadSlotSelector = ({
  activeSlot,
  slotBindings,
  visibleSlots,
}: ChatViewLayoutState) => ({
  activeSlot,
  slotBindings,
  visibleSlots,
});

const getThreadFromSlot = (
  slot: LayoutSlot | undefined,
  slotBindings: ChatViewLayoutState['slotBindings'],
) => {
  if (!slot) return;
  const entity = getChatViewEntityBinding(slotBindings[slot]);
  if (entity?.kind !== 'thread') return;
  return entity.source as StreamThread;
};

export const ThreadSlot = ({
  children,
  fallback = null,
  slot,
  ...threadProps
}: ThreadSlotProps) => {
  const { layoutController } = useChatViewContext();
  const { activeSlot, slotBindings, visibleSlots } =
    useStateStore(layoutController.state, threadSlotSelector) ??
    threadSlotSelector(layoutController.state.getLatestValue());

  const candidateSlots = slot ? [slot] : [activeSlot, ...visibleSlots];
  const thread =
    candidateSlots
      .map((candidateSlot) => getThreadFromSlot(candidateSlot, slotBindings))
      .find(Boolean) ?? undefined;

  if (!thread) return <>{fallback}</>;

  return (
    <ThreadProvider thread={thread}>
      {children ?? <ThreadComponent {...threadProps} />}
    </ThreadProvider>
  );
};
