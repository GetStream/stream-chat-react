import React, { useEffect } from 'react';

import { useChatViewContext, useSlotThread } from '../ChatView';
import { ThreadProvider } from '../Threads';
import { Thread as ThreadComponent, type ThreadProps } from './Thread';
import { ThreadSlotContext } from './ThreadSlotContext';

import type { PropsWithChildren, ReactNode } from 'react';
import type { SlotName } from '../ChatView/layoutController/layoutControllerTypes';

export type ThreadSlotProps = PropsWithChildren<
  ThreadProps & {
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
      <ThreadProvider thread={thread}>
        {children ?? <ThreadComponent {...threadProps} />}
      </ThreadProvider>
    </ThreadSlotContext.Provider>
  );
};
