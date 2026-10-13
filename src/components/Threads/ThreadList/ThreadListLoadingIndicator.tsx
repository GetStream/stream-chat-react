import React from 'react';

import type { PaginatorState, Thread } from 'stream-chat';

import { LoadingIndicator as DefaultLoadingIndicator } from '../../Loading';
import { useChatContext, useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';

// `isLoading` with threads already loaded means the next page is loading.
const selector = (nextValue: PaginatorState<Thread>) => ({
  isLoadingNext: nextValue.isLoading && !!nextValue.items?.length,
});

export const ThreadListLoadingIndicator = () => {
  const { LoadingIndicator = DefaultLoadingIndicator } = useComponentContext();
  const { client } = useChatContext();
  const { isLoadingNext } = useStateStore(client.threads.paginator.state, selector);

  if (!isLoadingNext) return null;

  return (
    <div className='str-chat__thread-list-loading-indicator'>
      <LoadingIndicator />
    </div>
  );
};
