import React, { createContext, useContext, useMemo } from 'react';

import { Channel } from '../../components';

import type { PropsWithChildren } from 'react';
import { Thread } from 'stream-chat';
import { useChatContext } from '../../context';

/**
 * TODO:
 * - make it easier for current state of the SDK to use thread methods (meaning thread should be fully initialized and checks like `thread.channel && ...` shouldn't exist (these checks are due to a "placeholder" which is used anytime components are utilised under normal circumstances - not under ThreadContext)
 */

export type ThreadContextValue = Thread | undefined;

export const ThreadContext = createContext<ThreadContextValue>(undefined);

export const useThreadContext = () => {
  const { client } = useChatContext();
  const thread = useContext(ThreadContext);

  const placeholder = useMemo(
    () => new Thread({ client, registerEventHandlers: false, threadData: {} }),
    [client],
  );

  if (!thread) return placeholder;

  return thread;
};

export const ThreadProvider = ({ children, thread }: PropsWithChildren<{ thread?: Thread }>) => (
  <ThreadContext.Provider value={thread}>
    <Channel channel={thread?.channel}>{children}</Channel>
  </ThreadContext.Provider>
);

/**
 *
 * client {
 *  channels[]
 *
 *  threads: {
 *    unreadCount,
 *    instances: Thread[]
 *  } -> have connections to channels
 * }
 *
 */

/**
 * <Threads> --> at this point just ui stuff probably
 *  <ThreadList />
 *  {thread && <ThreadFacilitator thread={thread}> (provider + Channel -> thread.channel)
 *      <Thread /> <- adjustment here (thread = useThreadContext(), use thread data, otherwise use channel stuff)
 *  </ThreadFacilitator>}
 * </Threads>
 *
 *  <InteractiveThreadList /> <- TBD (out of scope for MVP)
 */
