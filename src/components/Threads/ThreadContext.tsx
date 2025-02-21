import React, { createContext, useContext } from 'react';

import { Channel } from '../../components';

import type { PropsWithChildren } from 'react';
import type { Thread } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

export type ThreadContextValue = Thread | undefined;

export const ThreadContext = createContext<ThreadContextValue>(undefined);

export const useThreadContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const thread = useContext(ThreadContext);

  return (thread as unknown as Thread<StreamChatGenerics>) ?? undefined;
};

export const ThreadProvider = ({
  children,
  thread,
}: PropsWithChildren<{ thread?: Thread }>) => (
  <ThreadContext.Provider value={thread}>
    <Channel channel={thread?.channel}>{children}</Channel>
  </ThreadContext.Provider>
);
