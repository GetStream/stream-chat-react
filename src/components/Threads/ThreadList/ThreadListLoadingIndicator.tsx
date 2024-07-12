import React from 'react';

import type { InferStoreValueType, ThreadManager } from 'stream-chat';

import { LoadingIndicator as DefaultLoadingIndicator } from '../../Loading';
import { useChatContext, useComponentContext } from '../../../context';
import { useSimpleStateStore } from '../hooks/useSimpleStateStore';

const selector = (nextValue: InferStoreValueType<ThreadManager>) => [nextValue.loadingNextPage];

export const ThreadListLoadingIndicator = () => {
  const { LoadingIndicator = DefaultLoadingIndicator } = useComponentContext();
  const { client } = useChatContext();
  const [loadingNextPage] = useSimpleStateStore(client.threads.state, selector);

  // TODO: figure out both loading directions (maybe Virtuoso context?)
  if (!loadingNextPage) return null;

  return (
    <div className='str-chat__thread-list-loading-indicator'>
      <LoadingIndicator />
    </div>
  );
};
