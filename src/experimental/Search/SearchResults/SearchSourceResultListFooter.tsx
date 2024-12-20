import React from 'react';
import type { DefaultSearchSources, SearchSource, SearchSourceState } from '../SearchController';
import { SearchSourceLoadingResults as DefaultSearchSourceLoadingResults } from './SearchSourceLoadingResults';
import { useComponentContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { DefaultStreamChatGenerics } from '../../../types';

const searchSourceStateSelector = (value: SearchSourceState) => ({
  hasMore: value.hasMore,
  isLoading: value.isLoading,
});

export type SearchSourceResultListFooterProps = {
  searchSource: SearchSource;
};

export const SearchSourceResultListFooter = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  SearchSources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>({
  searchSource,
}: SearchSourceResultListFooterProps) => {
  const { t } = useTranslationContext();
  const { SearchSourceLoadingResults = DefaultSearchSourceLoadingResults } = useComponentContext<
    StreamChatGenerics,
    NonNullable<unknown>,
    SearchSources
  >();
  const { hasMore, isLoading } = useStateStore(searchSource.state, searchSourceStateSelector);

  return (
    <div className='str-chat__search-source-result-list__footer'>
      {isLoading ? (
        <SearchSourceLoadingResults searchSource={searchSource} />
      ) : !hasMore ? (
        <div className='str-chat__search-source-results---empty'>
          {t<string>('All results loaded')}
        </div>
      ) : null}
    </div>
  );
};
