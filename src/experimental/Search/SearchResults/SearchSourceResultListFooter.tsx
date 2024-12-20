import React from 'react';
import type { DefaultSearchSources, SearchSource, SearchSourceState } from '../SearchController';
import { SearchSourceResultsLoadingIndicator as DefaultSearchSourceResultsLoadingIndicator } from './SearchSourceResultsLoadingIndicator';
import { useSearchSourceResultsContext } from '../SearchSourceResultsContext';
import { useComponentContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { DefaultStreamChatGenerics } from '../../../types';

const searchSourceStateSelector = (value: SearchSourceState) => ({
  hasMore: value.hasMore,
  isLoading: value.isLoading,
});

export const SearchSourceResultListFooter = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  SearchSources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>() => {
  const { t } = useTranslationContext();
  const {
    SearchSourceResultsLoadingIndicator = DefaultSearchSourceResultsLoadingIndicator,
  } = useComponentContext<StreamChatGenerics, NonNullable<unknown>, SearchSources>();
  const { searchSource } = useSearchSourceResultsContext();
  const { hasMore, isLoading } = useStateStore(searchSource.state, searchSourceStateSelector);

  return (
    <div className='str-chat__search-source-result-list__footer'>
      {isLoading ? (
        <SearchSourceResultsLoadingIndicator />
      ) : !hasMore ? (
        <div className='str-chat__search-source-results---empty'>
          {t<string>('All results loaded')}
        </div>
      ) : null}
    </div>
  );
};
