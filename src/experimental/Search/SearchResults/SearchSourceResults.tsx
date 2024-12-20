import React from 'react';
import { SearchSourceResultList as DefaultSearchSourceResultList } from './SearchSourceResultList';
import { SearchSourceResultsEmpty as DefaultSearchSourceResultsEmpty } from './SearchSourceResultsEmpty';
import { SearchSourceResultsHeader as DefaultSearchSourceResultsHeader } from './SearchSourceResultsHeader';
import { useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { DefaultSearchSources, SearchSource, SearchSourceState } from '../SearchController';
import type { DefaultStreamChatGenerics } from '../../../types';

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  hasMore: nextValue.hasMore,
  isLoading: nextValue.isLoading,
  items: nextValue.items,
});

export type SearchSourceResultsProps = { searchSource: SearchSource };
export const SearchSourceResults = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  SearchSources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>({
  searchSource,
}: SearchSourceResultsProps) => {
  const {
    SearchSourceResultList = DefaultSearchSourceResultList,
    SearchSourceResultsEmpty = DefaultSearchSourceResultsEmpty,
    SearchSourceResultsHeader = DefaultSearchSourceResultsHeader,
  } = useComponentContext<StreamChatGenerics, NonNullable<unknown>, SearchSources>();
  const { isLoading, items } = useStateStore(searchSource.state, searchSourceStateSelector);

  if (!items && !isLoading) return null;
  return (
    <div className='str-chat__search-source-results'>
      <SearchSourceResultsHeader searchSource={searchSource} />
      {items?.length || isLoading ? (
        <SearchSourceResultList items={items} searchSource={searchSource} />
      ) : (
        <SearchSourceResultsEmpty searchSource={searchSource} />
      )}
    </div>
  );
};
