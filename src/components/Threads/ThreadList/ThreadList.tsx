import React, { useEffect } from 'react';
import type { ComputeItemKey, VirtuosoProps } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';

import type { Thread, ThreadManagerState } from 'stream-chat';

import { ThreadListItem as DefaultThreadListItem } from './ThreadListItem';
import { ThreadListEmptyPlaceholder as DefaultThreadListEmptyPlaceholder } from './ThreadListEmptyPlaceholder';
import { ThreadListUnseenThreadsBanner as DefaultThreadListUnseenThreadsBanner } from './ThreadListUnseenThreadsBanner';
import { ThreadListLoadingIndicator as DefaultThreadListLoadingIndicator } from './ThreadListLoadingIndicator';
import { useChatContext, useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';

const selector = (nextValue: ThreadManagerState) => ({
  threadCount: nextValue.threads.length,
  threads: nextValue.threads,
});

const computeItemKey: ComputeItemKey<Thread, unknown> = (_, item) => item.id;

type ThreadListProps = {
  virtuosoProps?: VirtuosoProps<Thread, unknown>;
};

export const useThreadList = () => {
  const { client } = useChatContext();

  useEffect(() => {
    // Reset derived pagination inputs before initial reload so the first mount requests
    // the default first page size, rather than a limit inferred from cached/unseen threads.
    const { pagination } = client.threads.state.getLatestValue();
    client.threads.state.partialNext({
      isThreadOrderStale: false,
      pagination: {
        ...pagination,
        nextCursor: null,
      },
      ready: false,
      threads: [],
      unseenThreadIds: [],
    });
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
  const {
    ThreadListEmptyPlaceholder = DefaultThreadListEmptyPlaceholder,
    ThreadListItem = DefaultThreadListItem,
    ThreadListLoadingIndicator = DefaultThreadListLoadingIndicator,
    ThreadListUnseenThreadsBanner = DefaultThreadListUnseenThreadsBanner,
  } = useComponentContext();
  const { threads } = useStateStore(client.threads.state, selector);

  useThreadList();

  return (
    <div className='str-chat__thread-list-container'>
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
    </div>
  );
};
