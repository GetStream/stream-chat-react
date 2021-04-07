import { useCallback } from 'react';

import type { MessageListProps } from '../MessageList';

export const useCallLoadMore = (loadMore: MessageListProps['loadMore'], limit: number) =>
  useCallback(() => {
    if (loadMore) {
      loadMore(limit);
    }
  }, [limit, loadMore]);
