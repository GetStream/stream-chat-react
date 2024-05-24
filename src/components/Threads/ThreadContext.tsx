import React, { createContext, useContext } from 'react';

import { Channel } from '../../components';

import type { PropsWithChildren } from 'react';
import { Thread } from 'stream-chat';
import { useChatContext } from '../../context';

export type ThreadContextValue = Thread | undefined;

export const ThreadContext = createContext<ThreadContextValue>(undefined);

export const useThreadContext = () => {
  const { client } = useChatContext();
  const thread = useContext(ThreadContext);

  if (!thread) return new Thread({ client, registerEventHandlers: false, threadData: {} });

  return thread;
};

export const ThreadProvider = ({ children, thread }: PropsWithChildren<{ thread?: Thread }>) => (
  <ThreadContext.Provider value={thread}>
    <Channel channel={thread?.channel}>{children}</Channel>
  </ThreadContext.Provider>
);

// export const ThreadFacilitator = ({
//   children,
//   thread,
// }: PropsWithChildren<{
//   thread: Thread;
// }>) => {
//   <ThreadProvider thread={thread}>
//     <Channel channel={thread.channel}>{children}</Channel>;
//   </ThreadProvider>;
// };

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
