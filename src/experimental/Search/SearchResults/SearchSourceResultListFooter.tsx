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

  return (
    <div
      className='str-chat__search-source-result-list__footer'
      data-testid='search-footer'
    >
      {isLoading ? (
        <SearchSourceResultsLoadingIndicator />
      ) : !hasNext ? (
        <div className='str-chat__search-source-results---empty'>
          {t<string>('All results loaded')}
        </div>
      ) : null}
    </div>
  );
};
