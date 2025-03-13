import React, { createContext, useContext } from 'react';

import { Channel } from '../../components';

import type { PropsWithChildren } from 'react';
import type { Thread } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

export type ThreadContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Thread<StreamChatGenerics> | undefined;

export const ThreadContext = createContext<ThreadContextValue>(undefined);

export const useThreadContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const thread = useContext(ThreadContext);

  return (thread as unknown as Thread<StreamChatGenerics>) ?? undefined;
};

export const ThreadProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
  thread,
}: PropsWithChildren<{ thread?: Thread<StreamChatGenerics> }>) => (
  // todo: solve ts-ignore
  // @ts-ignore
  <ThreadContext.Provider value={thread as unknown as Thread<StreamChatGenerics>}>
    <Channel channel={thread?.channel}>{children}</Channel>
  </ThreadContext.Provider>
);
