import clsx from 'clsx';
import type { PropsWithChildren } from 'react';
import { useChatContext } from 'stream-chat-react';

// A panel in the secondary slot that is neither a channel nor a thread: the `.str-chat` theme root
// its components' tokens and styles resolve from, on an opaque surface that fills the slot.
export const SecondarySlotSurface = ({ children }: PropsWithChildren) => {
  const { theme } = useChatContext();
  return (
    <div className={clsx('str-chat', theme, 'app-chat-secondary-surface')}>
      {children}
    </div>
  );
};
