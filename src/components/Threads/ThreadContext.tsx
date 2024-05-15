import { useChatContext } from '../../context/ChatContext';
import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';

import type { PropsWithChildren } from 'react';
import type { Thread } from 'stream-chat';

// temporarily, this context will provide loading functions for threads (loadNextPage/loadPreviousPage)
// but later should probably cease to exist as everything should live within client

/**
 *
 * client {
 *  channels[]
 *
 *  threads: {
 *    unreadCount,
 *    instances[]
 *  } -> have connections to channels
 * }
 *
 */

export type ThreadContextValue = {
  loadNextPage: null | (() => void);
  threads: Thread[];
};

export const ThreadContext = createContext<ThreadContextValue>({
  loadNextPage: null,
  threads: [],
});

export const Threads = ({ children }: PropsWithChildren) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const nextRef = useRef<string | undefined>(undefined);
  const { client } = useChatContext();

  const loadNextPage = useCallback(async () => {
    if (nextRef.current === 'finished') return;

    const data = await client.queryThreads({ next: nextRef.current });

    nextRef.current = data.next || 'finished';

    setThreads((pv) => [...pv, ...data.threads]);
  }, [client]);

  // TODO: initial load, temporary but clean this up
  useEffect(() => {
    loadNextPage();
  }, [loadNextPage]);

  return (
    <ThreadContext.Provider value={{ loadNextPage, threads }}>{children}</ThreadContext.Provider>
  );
};

/**
 * <Threads threads={[...]} > <- allow integrators to supply own list including loading and stuff
 *  <ThreadList />
 *  <Thread>
 *      <ThreadHeader/>
 *      <ThreadMessageList />
 *      <ThreadMessageInput />
 *  </Thread>
 *
 *  <InteractiveThreadList /> <- TBD (out of scope for MVP)
 * </Threads>
 */
