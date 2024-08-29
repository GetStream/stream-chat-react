import React from 'react';

import type { ThreadManagerState } from 'stream-chat';

import { LoadingIndicator as DefaultLoadingIndicator } from '../../Loading';
import { useChatContext, useComponentContext } from '../../../context';
import { useStateStore } from '../hooks/useStateStore';

const selector = (nextValue: ThreadManagerState) => [nextValue.pagination.isLoadingNext];

export const ThreadListLoadingIndicator = () => {
  const { LoadingIndicator = DefaultLoadingIndicator } = useComponentContext();
  const { client } = useChatContext();
  const [isLoadingNext] = useStateStore(client.threads.state, selector);

  if (!isLoadingNext) return null;

  return (
    <div className='str-chat__thread-list-loading-indicator'>
      <LoadingIndicator />
    </div>
  );
};
