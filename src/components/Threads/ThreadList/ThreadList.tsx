import React, { useContext } from 'react';
import { Virtuoso } from 'react-virtuoso';

import type { ComponentType } from 'react';

import { ThreadContext } from '../ThreadContext';
import { ThreadListItem } from './ThreadListItem';

import type { ThreadListItemProps } from './ThreadListItem';

// could be context provider? (for passing down custom components)
export const ThreadList = ({
  ThreadListItem: PropsThreadListItem = ThreadListItem,
}: {
  ThreadListItem?: ComponentType<ThreadListItemProps>;
}) => {
  const { loadNextPage, threads } = useContext(ThreadContext);

  return (
    <Virtuoso
      // TODO: str-chat class name does not belong here
      className='str-chat str-chat__thread-list'
      computeItemKey={(_, thread) => thread.id}
      data={threads}
      endReached={() => loadNextPage?.()}
      itemContent={(_, thread) => <PropsThreadListItem thread={thread} />}
    />
  );
};
