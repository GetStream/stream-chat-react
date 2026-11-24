import React, { useCallback, useEffect, useRef } from 'react';
import type { ComputeItemKey, VirtuosoHandle, VirtuosoProps } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';
import type { PaginatorState, Thread } from 'stream-chat';

import { useVirtualizedListboxKeyboardNavigation } from '../../../a11y/hooks/useVirtualizedListboxKeyboardNavigation';
import { ThreadListItem as DefaultThreadListItem } from './ThreadListItem';
import { ThreadListUnseenThreadsBanner as DefaultThreadListUnseenThreadsBanner } from './ThreadListUnseenThreadsBanner';
import { useThreadHighlighting } from './useThreadHighlighting';
import {
  ThreadListEmptyUI,
  ThreadListFirstPageLoadingUI,
  ThreadListLoadErrorUI,
  ThreadListLoadingNextPageUI,
} from './ListStates';
import { getFirstPageLoadError } from '../../ListStates/utils';
import { useFirstPageLoadRetry } from '../../ListStates/hooks';
import { NotificationList } from '../../Notifications';
import { useAddNotificationOnError } from '../../Notifications/hooks/useAddNotificationOnError';
import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../../context';
import { useStateStore } from '../../../store';
import { asVirtuosoSlot } from '../../../utils/virtuosoSlot';
import { ThreadListHeader as DefaultThreadListHeader } from './ThreadListHeader';

const noThreads: Thread[] = [];

const selector = (nextValue: PaginatorState<Thread>) => ({
  // A failed first load leaves no threads to show; a failed reload keeps the loaded ones.
  firstPageLoadError: getFirstPageLoadError(nextValue),
  isLoading: nextValue.isLoading,
  lastQueryError: nextValue.lastQueryError,
  threads: nextValue.items ?? noThreads,
});

const computeItemKey: ComputeItemKey<Thread, unknown> = (_, item) => item.id;

type ThreadListProps = {
  virtuosoProps?: VirtuosoProps<Thread, unknown>;
};

export const useThreadList = () => {
  const { client } = useChatContext();

  useEffect(() => {
    // Fresh list on every mount; the reload sizes its own page from the loaded and unseen threads.
    void client.threads.reload({ force: true });

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

export const ThreadList = ({ virtuosoProps }: ThreadListProps) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const {
    NotificationList: NotificationListFromContext = NotificationList,
    ThreadListHeader = DefaultThreadListHeader,
    ThreadListItem = DefaultThreadListItem,
    ThreadListUnseenThreadsBanner = DefaultThreadListUnseenThreadsBanner,
  } = useComponentContext();
  const { firstPageLoadError, isLoading, lastQueryError, threads } = useStateStore(
    client.threads.paginator.state,
    selector,
  );

  const resetByThreadId = useThreadHighlighting(client.threads);

  // The list is virtualized, so keyboard navigation indexes into the full `threads` array and uses
  // Virtuoso's `scrollIntoView` to render off-window rows before focusing them.
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

  useAddNotificationOnError(lastQueryError, {
    emitter: 'ThreadList',
    message: t('threadList.loadError.text', "Couldn't load threads"),
    targetPanels: ['thread-list'],
    type: 'api:thread:query:failed',
  });

  const firstPageLoadRetry = useFirstPageLoadRetry({
    firstPageLoadError,
    loadedMessage: t('threadList.loaded.text', 'Threads loaded'),
    paginator: client.threads.paginator,
    reload: () => client.threads.reload({ force: true }),
  });

  // Only a load without threads shows the first-page state; a reload keeps the loaded threads
  // until new ones land.
  const isLoadingFirstPage = isLoading && !threads.length;

  const renderList = () => (
    <>
      {/* TODO: allow re-load on stale ThreadManager state */}
      <ThreadListUnseenThreadsBanner />
      <Virtuoso
        aria-label={t('threadList.threadList.ariaLabel', 'Thread list')}
        atBottomStateChange={(atBottom) => atBottom && client.threads.paginator.toTail()}
        className='str-chat__thread-list'
        components={{
          EmptyPlaceholder: asVirtuosoSlot(ThreadListEmptyUI),
          Footer: asVirtuosoSlot(ThreadListLoadingNextPageUI),
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
    </>
  );

  // A failed first load shows the error instead of the empty placeholder, which would read as
  // "no threads".
  const renderFirstPageLoadError = (error: Error) => (
    <ThreadListLoadErrorUI
      error={error}
      isRetrying={firstPageLoadRetry.isRetrying}
      retry={firstPageLoadRetry.retry}
    />
  );

  const renderFirstPageLoading = () => (
    <div className='str-chat__thread-list str-chat__thread-list--loading'>
      <ThreadListFirstPageLoadingUI />
    </div>
  );

  return (
    <div className='str-chat__thread-list-container'>
      <ThreadListHeader />
      {/* The error comes first: a retry loads, and keeps the error on screen while it runs. */}
      {firstPageLoadRetry.error
        ? renderFirstPageLoadError(firstPageLoadRetry.error)
        : isLoadingFirstPage
          ? renderFirstPageLoading()
          : renderList()}
      <NotificationListFromContext panel='thread-list' />
    </div>
  );
};
