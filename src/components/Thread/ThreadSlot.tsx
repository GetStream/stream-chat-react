import React from 'react';

import { useSlotThread } from '../ChatView';
import { ThreadProvider } from '../Threads';
import { Thread as ThreadComponent, type ThreadProps } from './Thread';

import type { PropsWithChildren, ReactNode } from 'react';
import type { LayoutSlot } from '../ChatView/layoutController/layoutControllerTypes';

export type ThreadSlotProps = PropsWithChildren<
  ThreadProps & {
    fallback?: ReactNode;
    slot?: LayoutSlot;
  }
>;

export const ThreadSlot = ({
  children,
  fallback = null,
  slot,
  ...threadProps
}: ThreadSlotProps) => {
  const thread = useSlotThread({ slot });

  if (!thread) return <>{fallback}</>;

  return (
    <ThreadProvider thread={thread}>
      {children ?? <ThreadComponent {...threadProps} />}
    </ThreadProvider>
  );
};
