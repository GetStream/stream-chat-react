import React, { useEffect } from 'react';
import type { ComputeItemKey, VirtuosoProps } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';
import clsx from 'clsx';

import type { Thread, ThreadManagerState } from 'stream-chat';

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

export const ThreadList = ({ virtuosoProps }: ThreadListProps) => {
  const { client, navOpen = true } = useChatContext();
  const {
    ThreadListEmptyPlaceholder = DefaultThreadListEmptyPlaceholder,
    ThreadListItem = DefaultThreadListItem,
    ThreadListLoadingIndicator = DefaultThreadListLoadingIndicator,
    ThreadListUnseenThreadsBanner = DefaultThreadListUnseenThreadsBanner,
  } = useComponentContext();
  const { isLoading, threads } = useStateStore(client.threads.state, selector);

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
        itemContent={(_, thread) => <ThreadListItem thread={thread} />}
        // TODO: handle visibility (for a button that scrolls to the unread thread)
        // itemsRendered={(items) => console.log({ items })}
        {...virtuosoProps}
      />
      <NotificationList panel='thread-list' />
    </div>
  );
};
