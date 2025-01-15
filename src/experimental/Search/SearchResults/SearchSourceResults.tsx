import React from 'react';

import { SearchSourceResultList as DefaultSearchSourceResultList } from './SearchSourceResultList';
import { SearchSourceResultsEmpty as DefaultSearchSourceResultsEmpty } from './SearchSourceResultsEmpty';
import { SearchSourceResultsHeader as DefaultSearchSourceResultsHeader } from './SearchSourceResultsHeader';
import { SearchSourceResultsContextProvider } from '../SearchSourceResultsContext';
import { useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';

import type { SearchSource, SearchSourceState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../../types';

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  hasMore: nextValue.hasMore,
  isLoading: nextValue.isLoading,
  items: nextValue.items,
});

export type SearchSourceResultsProps = { searchSource: SearchSource };

export const SearchSourceResults = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  searchSource,
}: SearchSourceResultsProps) => {
  const {
    SearchSourceResultList = DefaultSearchSourceResultList,
    SearchSourceResultsEmpty = DefaultSearchSourceResultsEmpty,
    SearchSourceResultsHeader = DefaultSearchSourceResultsHeader,
  } = useComponentContext<StreamChatGenerics>();
  const { isLoading, items } = useStateStore(searchSource.state, searchSourceStateSelector);

  if (!items && !isLoading) return null;

  return (
    <SearchSourceResultsContextProvider value={{ searchSource }}>
      <div className='str-chat__search-source-results' data-testid='search-source-results'>
        <SearchSourceResultsHeader />
        {items?.length || isLoading ? <SearchSourceResultList /> : <SearchSourceResultsEmpty />}
      </div>
    </SearchSourceResultsContextProvider>
  );
};
