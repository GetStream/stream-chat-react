import React, { createContext, useContext } from 'react';

import { Channel } from '../../components';

import type { PropsWithChildren } from 'react';
import type { Thread } from 'stream-chat';

export type ThreadContextValue = Thread | undefined;

export const ThreadContext = createContext<ThreadContextValue>(undefined);

export const useThreadContext = () => {
  const thread = useContext(ThreadContext);

  return thread ?? undefined;
};

export const ThreadProvider = ({
  children,
  thread,
}: PropsWithChildren<{ thread?: Thread }>) => (
  <ThreadContext.Provider value={thread}>
    <Channel channel={thread?.channel}>{children}</Channel>
  </ThreadContext.Provider>
);
