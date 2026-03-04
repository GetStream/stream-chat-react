import clsx from 'clsx';
import React from 'react';
import { useMemo } from 'react';

import { useStateStore } from '../../../store';
import { getChatViewEntityBinding, useChatViewContext } from '../ChatView';

import type { ReactNode } from 'react';
import type { ChatViewLayoutState } from '../layoutController/layoutControllerTypes';

export type SlotProps = {
  children?: ReactNode;
  className?: string;
  slot: string;
};

const slotHiddenSelector =
  (slot: string) =>
  ({ entityListPaneOpen, hiddenSlots, slotBindings }: ChatViewLayoutState) => ({
    entityListPaneOpen,
    isChannelListSlot:
      getChatViewEntityBinding(slotBindings[slot])?.kind === 'channelList',
    isExplicitlyHidden: !!hiddenSlots?.[slot],
  });

export const Slot = ({ children, className, slot }: SlotProps) => {
  const { layoutController } = useChatViewContext();
  const selector = useMemo(() => slotHiddenSelector(slot), [slot]);
  const { entityListPaneOpen, isChannelListSlot, isExplicitlyHidden } =
    useStateStore(layoutController.state, selector) ??
    selector(layoutController.state.getLatestValue());
  const hidden = isExplicitlyHidden || (isChannelListSlot && !entityListPaneOpen);

  return (
    <section
      aria-hidden={hidden || undefined}
      className={clsx(
        'str-chat__chat-view__slot',
        {
          'str-chat__chat-view__slot--hidden': hidden,
        },
        className,
      )}
      data-slot={slot}
    >
      {children}
    </section>
  );
};
