import { useCallback } from 'react';
import type { BaseSearchSource, SearchSourceState } from 'stream-chat';

import { useFirstPageLoadRetry } from '../../../components/ListStates/hooks';
import { getErrorShownInPlaceOfList } from '../../../components/ListStates/utils';
import { useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

const searchSourceQueryStateSelector = ({
  isLoading,
  lastQueryError,
}: SearchSourceState<unknown>) => ({ isLoading, lastQueryError });

/**
 * Retries the failed first page of a channel detail view's search source.
 *
 * @param searchSource The source the view lists.
 * @param options.hasItemsToShow The view shows items, from the source or from elsewhere (e.g. the
 *   members in the channel state); a failed query then shows no error.
 * @returns `error`, the error to show in place of the list, `isRetrying`, and `retry`, which starts
 *   the source over with its search query.
 */
export const useChannelDetailFirstPageLoadRetry = <T>(
  searchSource: BaseSearchSource<T>,
  { hasItemsToShow }: { hasItemsToShow: boolean },
) => {
  const { t } = useTranslationContext();
  const { isLoading, lastQueryError } = useStateStore(
    searchSource.state,
    searchSourceQueryStateSelector,
  );
  // Starts the source over with the search query that failed. A query typed within its debounce is
  // dropped, so it would not replace the retry; the input keeps that text until the next keystroke.
  // The reset makes the source show as loading with no failed page, so a view that fills its page
  // from the source starts no query of its own meanwhile.
  const reload = useCallback(() => {
    const { searchQuery } = searchSource;
    searchSource.cancelScheduledQuery();
    searchSource.resetState();
    searchSource.activate();
    return searchSource.executeQuery(searchQuery);
  }, [searchSource]);

  return useFirstPageLoadRetry({
    firstPageLoadError: getErrorShownInPlaceOfList({
      hasItemsToShow,
      isLoading,
      lastQueryError,
    }),
    loadedMessage: t('channelDetail.listLoaded.text', 'List loaded'),
    paginator: searchSource,
    reload,
  });
};
