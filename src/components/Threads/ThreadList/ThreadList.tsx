import React, { useEffect } from 'react';
import { ComputeItemKey, Virtuoso, VirtuosoProps } from 'react-virtuoso';

import type { ComponentType } from 'react';
import type { InferStoreValueType, Thread, ThreadManager } from 'stream-chat';

import { ThreadListItem, ThreadListItemUi } from './ThreadListItem';
import { Icon } from '../icons';
import { useChatContext } from '../../../context';
import { useSimpleStateStore } from '../hooks/useSimpleStateStore';

import type { ThreadListItemProps, ThreadListItemUiProps } from './ThreadListItem';

/**
 * TODO:
 * - add virtuosoProps override \w support for supplying custom threads array (typed virtuoso props, Thread[] only)
 * - register event handlers of each of the threads (ThreadManager - threads.<de/register>EventHandlers(), maybe simplify API)
 * - add Header with re-query button + logic to ThreadManager
 * - add Footer with "Loading"
 * - move str-chat someplace else, think of a different name (str-chat__thread-list already used)
 * - move itemContent to a component instead
 *
 * NICE TO HAVE:
 * - probably good idea to move component context up to a Chat component
 */

const selector = (nextValue: InferStoreValueType<ThreadManager>) =>
  [nextValue.unreadThreads.newIds, nextValue.threads] as const;

const computeItemKey: ComputeItemKey<Thread, unknown> = (_, item) => item.id;

type ThreadListProps = {
  ThreadListItem?: ComponentType<ThreadListItemProps>;
  ThreadListItemUi?: ComponentType<ThreadListItemUiProps>;
  virtuosoProps?: VirtuosoProps<Thread, unknown>;
};

export const ThreadList = ({
  // FIXME: temporary, should be removed when ComponentOverride component is out
  ThreadListItemUi: PropsThreadListItemUi = ThreadListItemUi,
  ThreadListItem: PropsThreadListItem = ThreadListItem,
  virtuosoProps,
}: ThreadListProps) => {
  const { client } = useChatContext();
  const [unreadThreadIds, threads] = useSimpleStateStore(client.threads.state, selector);

  useEffect(() => {
    client.threads.loadNextPage();
  }, [client]);

  return (
    <div className='str-chat__thread-list-container'>
      {/* TODO: create a replaceable banner component */}
      {unreadThreadIds.length > 0 && (
        <div className='str-chat__unread-threads-banner'>
          {unreadThreadIds.length} unread threads
          <button
            className='str-chat__unread-threads-banner__button'
            onClick={client.threads.loadUnreadThreads}
          >
            <Icon.Reload />
          </button>
        </div>
      )}
      <Virtuoso
        atBottomStateChange={(atBottom) => atBottom && client.threads.loadNextPage()}
        className='str-chat__thread-list'
        computeItemKey={computeItemKey}
        data={threads}
        itemContent={(_, thread) => (
          <PropsThreadListItem thread={thread} ThreadListItemUi={PropsThreadListItemUi} />
        )}
        {...virtuosoProps}
      />
    </div>
  );
};
