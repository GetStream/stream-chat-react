import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { DefaultStreamChatGenerics, useChatContext } from 'stream-chat-react';
import { Channel, Thread } from 'stream-chat';
import { useNotificationThreadMessageNew } from './useNotificationThreadMessageNew';
import { useMessageUpdated } from './useMessageUpdated';

export type ThreadListContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  loadMoreReplies: (thread: Thread<StreamChatGenerics>) => void;
  /**
   * Loads the next page of threads.
   */
  loadNextPage: () => Promise<void>;
  /**
   * Reloads the list of threads.
   */
  reloadThreads: () => Promise<void>;
  /**
   * Sets the list of Thread objects to be rendered by ThreadList component.
   */
  setThreads: Dispatch<SetStateAction<Thread<StreamChatGenerics>[]>>;
  /**
   * State representing the array of loaded threads.
   * Threads query is executed by default only by ThreadList component in the SDK.
   */
  threads: Thread<StreamChatGenerics>[];
};

export const ThreadListContext = createContext<ThreadListContextValue | undefined>(undefined);

/**
 * Context provider for components rendered within the `ThreadList`
 */
export const ThreadListContextProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  children,
}: React.PropsWithChildren<unknown>) => {
  const { client, setActiveChannel, setThreadListOpen } = useChatContext<StreamChatGenerics>();

  const [threads, setThreads] = useState<Thread<StreamChatGenerics>[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

  useNotificationThreadMessageNew(threads, setThreads);
  useMessageUpdated(threads, setThreads);

  const markThreadsRead = useCallback(
    (threads: Thread<StreamChatGenerics>[]) => {
      const clientUserId = client.user?.id;
      if (!clientUserId) return;
      threads.forEach((thread) => {
        const read = thread.read[clientUserId];
        if (!read) return;

        if (read.unread_messages > 0) {
          // eslint-disable-next-line no-underscore-dangle
          thread._channel.markRead({ thread_id: thread.id });
        }
      });
    },
    [client.user?.id, threads],
  );

  const reloadThreads = useCallback(async () => {
    setActiveChannel?.(undefined);
    setThreadListOpen?.(true);
    const { next, threads } = await client.queryThreads();
    setThreads(threads);
    setNextCursor(next);

    markThreadsRead(threads);
  }, [markThreadsRead]);

  const loadNextPage = useCallback(async () => {
    if (!nextCursor) return;

    const { next, threads: newThreads } = await client.queryThreads({
      next: nextCursor,
    });

    setThreads((threads) => [...threads, ...newThreads]);
    setNextCursor(next);
    markThreadsRead(threads);
  }, [nextCursor, markThreadsRead]);

  const loadMoreReplies = useCallback(
    async (thread: Thread<StreamChatGenerics>, channel: Channel<StreamChatGenerics>) => {
      const { messages } = await channel.getReplies(thread.id, {
        id_lt: thread.latestReplies[0].id,
        limit: 10,
      });

      setThreads((threads) => {
        const threadIndex = threads.findIndex((t) => t.id === thread.id);
        const newThreads = [...threads];
        const targetThread = newThreads[threadIndex];

        messages.forEach((message) => {
          targetThread.addReply(message);
        });
        return newThreads;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ loadMoreReplies, loadNextPage, reloadThreads, setThreads, threads }),
    [threads, reloadThreads, loadMoreReplies, loadNextPage],
  );

  return (
    <ThreadListContext.Provider value={(value as unknown) as ThreadListContextValue}>
      {children}
    </ThreadListContext.Provider>
  );
};

export const useThreadListContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  componentName?: string,
) => {
  const contextValue = useContext(ThreadListContext);

  if (!contextValue) {
    console.warn(
      `The useThreadListContext hook was called outside of the ThreadListContext provider. Make sure this hook is called within a child of the Chat component. The errored call is located in the ${componentName} component.`,
    );

    return {} as ThreadListContextValue<StreamChatGenerics>;
  }

  return (contextValue as unknown) as ThreadListContextValue<StreamChatGenerics>;
};
