import React, { useEffect } from 'react';
import { ComputeItemKey, Virtuoso } from 'react-virtuoso';

import type { ComponentType, PointerEvent } from 'react';
import type { InferStoreValueType, Thread, ThreadManager } from 'stream-chat';

import { ThreadListItem } from './ThreadListItem';
import { useChatContext } from '../../../context';
import { useSimpleStateStore } from '../hooks/useSimpleStateStore';

import type { ThreadListItemProps } from './ThreadListItem';

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

const selector = (nextValue: InferStoreValueType<ThreadManager>) => [nextValue.threads] as const;

const computeItemKey: ComputeItemKey<Thread, unknown> = (_, item) => item.id;

type ThreadListProps = {
  onItemPointerDown?: (event: PointerEvent<HTMLButtonElement>, thread: Thread) => void;
  ThreadListItem?: ComponentType<ThreadListItemProps>;
  // threads?: Thread[]
};

export const ThreadList = ({
  ThreadListItem: PropsThreadListItem = ThreadListItem,
  onItemPointerDown,
}: ThreadListProps) => {
  const { client } = useChatContext();
  const [threads] = useSimpleStateStore(client.threads.state, selector);

  useEffect(() => {
    client.threads.loadNextPage();
  }, [client]);

  return (
    <Virtuoso
      atBottomStateChange={(atBottom) => atBottom && client.threads.loadNextPage()}
      className='str-chat str-chat__thread-list'
      computeItemKey={computeItemKey}
      data={threads}
      itemContent={(_, thread) => (
        <PropsThreadListItem
          onPointerDown={(e) => onItemPointerDown?.(e, thread)}
          thread={thread}
        />
      )}
      style={{ height: '100%', width: '50%' }}
    />
  );
};
