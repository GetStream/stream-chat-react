import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ComputeItemKey, VirtuosoHandle, VirtuosoProps } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';
import type { Thread, ThreadManager, ThreadManagerState } from 'stream-chat';

import { useVirtualizedListboxKeyboardNavigation } from '../../../a11y/hooks/useVirtualizedListboxKeyboardNavigation';
import { ThreadListItem as DefaultThreadListItem } from './ThreadListItem';
import { ThreadListEmptyPlaceholder as DefaultThreadListEmptyPlaceholder } from './ThreadListEmptyPlaceholder';
import { ThreadListUnseenThreadsBanner as DefaultThreadListUnseenThreadsBanner } from './ThreadListUnseenThreadsBanner';
import { ThreadListLoadingIndicator as DefaultThreadListLoadingIndicator } from './ThreadListLoadingIndicator';
import { LoadingChannels } from '../../Loading';
import { NotificationList } from '../../Notifications';
import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../../context';
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
  const { client } = useChatContext();
  const { t } = useTranslationContext('ThreadList');
  const {
    NotificationList: NotificationListFromContext = NotificationList,
    ThreadListEmptyPlaceholder = DefaultThreadListEmptyPlaceholder,
    ThreadListItem = DefaultThreadListItem,
    ThreadListLoadingIndicator = DefaultThreadListLoadingIndicator,
    ThreadListUnseenThreadsBanner = DefaultThreadListUnseenThreadsBanner,
  } = useComponentContext();
  const { isLoading, threads } = useStateStore(client.threads.state, selector);

  const resetByThreadId = useThreadHighlighting(client.threads);

  // Keyboard roving for the thread list (a `role="listbox"` of `role="option"` rows, no row actions
  // → ArrowUp/Down/Home/End only). The list is virtualized, so only a window of rows exists in the
  // DOM at a time; `useVirtualizedListboxKeyboardNavigation` indexes into the full `threads` array
  // and drives Virtuoso's `scrollIntoView` to bring off-window rows into existence before focusing.
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const scrollerRef = useRef<HTMLElement | null>(null);

  const scrollIndexIntoView = useCallback((index: number, onRendered: () => void) => {
    virtuosoRef.current?.scrollIntoView({ done: onRendered, index });
  }, []);

  const { onKeyDown } = useVirtualizedListboxKeyboardNavigation({
    getItemId: (thread) => thread.id,
    itemIdAttribute: 'data-thread-id',
    items: threads,
    scrollerRef,
    scrollIndexIntoView,
  });

  useThreadList();

  if (isLoading && !threads.length) {
    return (
      <div className='str-chat__thread-list-container'>
        <ThreadListHeader />
        <div className='str-chat__thread-list str-chat__thread-list--loading'>
          <LoadingChannels />
        </div>
      </div>
    );
  }

  return (
    <div className='str-chat__thread-list-container'>
      <ThreadListHeader />
      {/* TODO: allow re-load on stale ThreadManager state */}
      <ThreadListUnseenThreadsBanner />
      <Virtuoso
        aria-label={t('aria/Thread list')}
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
        onKeyDown={(event) =>
          onKeyDown(event as unknown as React.KeyboardEvent<HTMLElement>)
        }
        ref={virtuosoRef}
        role='listbox'
        scrollerRef={(el) => {
          scrollerRef.current = el instanceof HTMLElement ? el : null;
        }}
        // TODO: handle visibility (for a button that scrolls to the unread thread)
        // itemsRendered={(items) => console.log({ items })}
        {...virtuosoProps}
      />
      <NotificationListFromContext panel='thread-list' />
    </div>
  );
};
