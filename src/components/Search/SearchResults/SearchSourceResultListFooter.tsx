import React from 'react';
import type { SearchSourceState } from 'stream-chat';

import { SearchSourceResultsLoadingIndicator as DefaultSearchSourceResultsLoadingIndicator } from './SearchSourceResultsLoadingIndicator';
import { useSearchSourceResultsContext } from '../SearchSourceResultsContext';
import { useComponentContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

const searchSourceStateSelector = (value: SearchSourceState) => ({
  hasNext: value.hasNext,
  isLoading: value.isLoading,
});

export const SearchSourceResultListFooter = () => {
  const { t } = useTranslationContext();
  const {
    SearchSourceResultsLoadingIndicator = DefaultSearchSourceResultsLoadingIndicator,
  } = useComponentContext();
  const { searchSource } = useSearchSourceResultsContext();
  const { hasNext, isLoading } = useStateStore(
    searchSource.state,
    searchSourceStateSelector,
  );

  // The "all results loaded" end-of-list status is announced (combined with the result count) by
  // `useAnnounceSearchResultCount`; here it is visual only.
  return (
    <div
      className='str-chat__search-source-result-list__footer'
      data-testid='search-footer'
    >
      {isLoading ? (
        <SearchSourceResultsLoadingIndicator />
      ) : !hasNext ? (
        // Hidden from assistive tech: the end-of-list status is announced (combined with the result
        // count) by `useAnnounceSearchResultCount`, so the text is not read as a navigable result.
        <div aria-hidden='true' className='str-chat__search-source-results---empty'>
          {t('All results loaded')}
        </div>
      ) : null}
    </div>
  );
};
