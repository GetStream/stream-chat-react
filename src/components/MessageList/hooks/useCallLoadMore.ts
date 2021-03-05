import { useCallback } from 'react';

export const useCallLoadMore = (loadMore: undefined | ((limit: number) => void), limit: number) =>
  useCallback(() => {
    if (loadMore) {
      loadMore(limit);
    }
  }, [loadMore, limit]);
