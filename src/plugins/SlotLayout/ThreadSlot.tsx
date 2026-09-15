import React, { useEffect } from 'react';

import { useChatViewContext } from './ChatView';
import { useSlotThread } from './hooks';
import { Thread, type ThreadProps } from '../../components/Thread';
import { ThreadSlotContext } from './ThreadSlotContext';

import type { PropsWithChildren, ReactNode } from 'react';
import type { SlotName } from './layoutController/layoutControllerTypes';

export type ThreadSlotProps = PropsWithChildren<
  Omit<ThreadProps, 'thread'> & {
    fallback?: ReactNode;
    hideIfEmpty?: boolean;
    slot?: SlotName;
  }
>;

export const ThreadSlot = ({
  children,
  fallback = null,
  hideIfEmpty = true,
  slot,
  ...threadProps
}: ThreadSlotProps) => {
  const { layoutController } = useChatViewContext();
  const thread = useSlotThread({ slot });

  useEffect(() => {
    if (!slot || !hideIfEmpty) return;
    if (thread) layoutController.unhide(slot);
    else layoutController.hide(slot);
  }, [hideIfEmpty, layoutController, slot, thread]);

  if (!thread) return <>{fallback}</>;

  return (
    <ThreadSlotContext.Provider value={slot}>
      <Thread {...threadProps} thread={thread}>
        {children}
      </Thread>
    </ThreadSlotContext.Provider>
  );
};
