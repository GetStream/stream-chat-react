'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import type { Channel } from 'stream-chat';

interface ActiveChannelContextType {
  activeChannel: Channel | undefined;
  setActiveChannel: (channel: Channel) => void;
}

const ActiveChannelContext = createContext<ActiveChannelContextType | undefined>(
  undefined,
);

/**
 * The conversation shown in the chat area. stream-chat-react v15 has no `setActiveChannel` on
 * `ChatContext`: whoever renders `<Channel channel={…}>` owns which channel that is, so the app
 * keeps it here and the sidebar, "New chat" button and URL loader write to it.
 */
export const useActiveChannel = () => {
  const context = useContext(ActiveChannelContext);
  if (!context) {
    throw new Error('useActiveChannel must be used within ActiveChannelProvider');
  }
  return context;
};

export const ActiveChannelProvider = ({ children }: { children: ReactNode }) => {
  const [activeChannel, setActiveChannel] = useState<Channel>();

  const value = useMemo(() => ({ activeChannel, setActiveChannel }), [activeChannel]);

  return (
    <ActiveChannelContext.Provider value={value}>
      {children}
    </ActiveChannelContext.Provider>
  );
};
