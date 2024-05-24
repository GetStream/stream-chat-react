import React, { useEffect } from 'react';
import { ComputeItemKey, Virtuoso } from 'react-virtuoso';
import { StreamChat } from 'stream-chat';

import type { ComponentType, PointerEvent } from 'react';
import type { InferStoreValueType, Thread } from 'stream-chat';

import { ThreadListItem } from './ThreadListItem';
import { useChatContext } from '../../../context';
import { useSimpleStateStore } from '../hooks/useSimpleStateStore';

import type { ThreadListItemProps } from './ThreadListItem';

const selector = (v: InferStoreValueType<StreamChat['threads']>) => [v.threads] as const;

const computeItemKey: ComputeItemKey<Thread, unknown> = (_, item) => item.id;

type ThreadListProps = {
  onItemPointerDown?: (event: PointerEvent<HTMLButtonElement>, thread: Thread) => void;
  ThreadListItem?: ComponentType<ThreadListItemProps>;
  // TODO: should support supplying custom threads array
  // threads?: Thread[]
};

// TODO: probably good idea to move component context up to a Chat component

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
      atBottomStateChange={(atBottom) =>
        // TODO: figure out - handle next page load blocking client-side or here?
        atBottom && client.threads.loadNextPage()
      }
      // TODO: str-chat class name does not belong here, str-chat__thread-list is already used (FUCK ME SIDEWAYS)
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
