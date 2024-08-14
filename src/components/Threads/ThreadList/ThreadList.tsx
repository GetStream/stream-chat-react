import React, { useEffect } from 'react';
import { ComputeItemKey, Virtuoso, VirtuosoProps } from 'react-virtuoso';

import type { Thread, ThreadManagerState } from 'stream-chat';

import { ThreadListItem as DefaultThreadListItem } from './ThreadListItem';
import { ThreadListEmptyPlaceholder as DefaultThreadListEmptyPlaceholder } from './ThreadListEmptyPlaceholder';
import { ThreadListUnseenThreadsBanner as DefaultThreadListUnseenThreadsBanner } from './ThreadListUnseenThreadsBanner';
import { ThreadListLoadingIndicator as DefaultThreadListLoadingIndicator } from './ThreadListLoadingIndicator';
import { useChatContext, useComponentContext } from '../../../context';
import { useSimpleStateStore } from '../hooks/useSimpleStateStore';

const selector = (nextValue: ThreadManagerState) => [nextValue.threads] as const;

const computeItemKey: ComputeItemKey<Thread, unknown> = (_, item) => item.id;

type ThreadListProps = {
  virtuosoProps?: VirtuosoProps<Thread, unknown>;
};

const useThreadList = () => {
  const { client } = useChatContext();

  useEffect(() => {
    const { threads } = client.threads.state.getLatestValue();

    // load threads upon "initial" ThreadList render
    if (!threads.length) client.threads.loadNextPage();

    client.threads.activate();

    return () => {
      client.threads.deactivate();
    };
  }, [client]);
};

export const ThreadList = ({ virtuosoProps }: ThreadListProps) => {
  const { client } = useChatContext();
  const {
    ThreadListItem = DefaultThreadListItem,
    ThreadListEmptyPlaceholder = DefaultThreadListEmptyPlaceholder,
    ThreadListLoadingIndicator = DefaultThreadListLoadingIndicator,
    ThreadListUnseenThreadsBanner = DefaultThreadListUnseenThreadsBanner,
  } = useComponentContext();
  const [threads] = useSimpleStateStore(client.threads.state, selector);

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
