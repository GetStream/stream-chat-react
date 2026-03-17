import React, { useEffect, useState } from 'react';
import type { ComputeItemKey, VirtuosoProps } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';
import clsx from 'clsx';

import type { Thread, ThreadManager, ThreadManagerState } from 'stream-chat';

import { ThreadListItem as DefaultThreadListItem } from './ThreadListItem';
import { ThreadListEmptyPlaceholder as DefaultThreadListEmptyPlaceholder } from './ThreadListEmptyPlaceholder';
import { ThreadListUnseenThreadsBanner as DefaultThreadListUnseenThreadsBanner } from './ThreadListUnseenThreadsBanner';
import { ThreadListLoadingIndicator as DefaultThreadListLoadingIndicator } from './ThreadListLoadingIndicator';
import { LoadingChannels } from '../../Loading';
import { NotificationList } from '../../Notifications';
import { useChatContext, useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';
import { ThreadListHeader } from './ThreadListHeader';

const selector = (nextValue: ThreadManagerState) => ({
  isLoading: nextValue.pagination.isLoading,
  threads: nextValue.threads,
});

const computeItemKey: ComputeItemKey<Thread, unknown> = (_, item) => item.id;

type ThreadListProps = {
  virtuosoProps?: VirtuosoProps<Thread, unknown>;
};

export const useThreadList = () => {
  const { client } = useChatContext();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        client.threads.activate();
      }
      if (document.visibilityState === 'hidden') {
        client.threads.deactivate();
      }
    };

    handleVisibilityChange();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      client.threads.deactivate();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [client]);
};

const useThreadHighlighting = (threadManager: ThreadManager) => {
  const [threadsToHighlight, setThreadsToHighlight] = useState<
    Record<string, () => void>
  >({});

  useEffect(() => {
    const unsubscribe = threadManager.state.subscribeWithSelector(
      (state) => state.threads,
      (nextThreads, previousThreads) => {
        if (!previousThreads) return;

        const resetByThreadId: Record<string, () => void> = {};

        for (const thread of nextThreads) {
          if (previousThreads.includes(thread)) continue;

          resetByThreadId[thread.id] = () => {
            setThreadsToHighlight((pv) => {
              const copy = { ...pv };
              delete copy[thread.id];
              return copy;
            });
          };
        }

        setThreadsToHighlight(resetByThreadId);
      },
    );

    return unsubscribe;
  });

  return threadsToHighlight;
};

export const ThreadList = ({ virtuosoProps }: ThreadListProps) => {
  const { client, navOpen = true } = useChatContext();
  const {
    NotificationList: NotificationListFromContext = NotificationList,
    ThreadListEmptyPlaceholder = DefaultThreadListEmptyPlaceholder,
    ThreadListItem = DefaultThreadListItem,
    ThreadListLoadingIndicator = DefaultThreadListLoadingIndicator,
    ThreadListUnseenThreadsBanner = DefaultThreadListUnseenThreadsBanner,
  } = useComponentContext();
  const { isLoading, threads } = useStateStore(client.threads.state, selector);

  const resetByThreadId = useThreadHighlighting(client.threads);

  useThreadList();

  if (isLoading && !threads.length) {
    return (
      <div
        className={clsx('str-chat__thread-list-container', {
          'str-chat__thread-list-container--open': navOpen,
        })}
      >
        <ThreadListHeader />
        <div className='str-chat__thread-list str-chat__thread-list--loading'>
          <LoadingChannels />
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx('str-chat__thread-list-container', {
        'str-chat__thread-list-container--open': navOpen,
      })}
    >
      <ThreadListHeader />
      {/* TODO: allow re-load on stale ThreadManager state */}
      <ThreadListUnseenThreadsBanner />
      <Virtuoso
        atBottomStateChange={(atBottom) => atBottom && client.threads.loadNextPage()}
        className='str-chat__thread-list'
        components={{
          EmptyPlaceholder: ThreadListEmptyPlaceholder,
          Footer: ThreadListLoadingIndicator,
        }}
        computeItemKey={computeItemKey}
        data={threads}
        itemContent={(_, thread) => (
          <ThreadListItem
            thread={thread}
            threadListItemUIProps={{
              resetHighlighting: resetByThreadId[thread.id],
            }}
          />
        )}
        // TODO: handle visibility (for a button that scrolls to the unread thread)
        // itemsRendered={(items) => console.log({ items })}
        {...virtuosoProps}
      />
      <NotificationListFromContext panel='thread-list' />
    </div>
  );
};
