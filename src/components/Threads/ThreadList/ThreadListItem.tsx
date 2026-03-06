import React, { createContext, useContext } from 'react';

import type { Thread } from 'stream-chat';

import { useComponentContext } from '../../../context';
import { ThreadListItemUI as DefaultThreadListItemUI } from './ThreadListItemUI';

import type { ThreadListItemUIProps } from './ThreadListItemUI';

export type ThreadListItemProps = {
  thread: Thread;
  threadListItemUIProps?: ThreadListItemUIProps;
};

const ThreadListItemContext = createContext<Thread | undefined>(undefined);

export const useThreadListItemContext = () => useContext(ThreadListItemContext);

export const ThreadListItem = ({
  thread,
  threadListItemUIProps,
}: ThreadListItemProps) => {
  const { ThreadListItemUI = DefaultThreadListItemUI } = useComponentContext();

  return (
    <ThreadListItemContext.Provider value={thread}>
      <ThreadListItemUI {...threadListItemUIProps} />
    </ThreadListItemContext.Provider>
  );
};
