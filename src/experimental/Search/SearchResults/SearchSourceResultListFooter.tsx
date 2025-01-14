import React from 'react';

import { SearchSourceResultsLoadingIndicator as DefaultSearchSourceResultsLoadingIndicator } from './SearchSourceResultsLoadingIndicator';
import { useSearchSourceResultsContext } from '../SearchSourceResultsContext';
import { useComponentContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

import type { SearchSourceState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../../types';

const searchSourceStateSelector = (value: SearchSourceState) => ({
  hasMore: value.hasMore,
  isLoading: value.isLoading,
});

export const SearchSourceResultListFooter = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { t } = useTranslationContext();
  const {
    SearchSourceResultsLoadingIndicator = DefaultSearchSourceResultsLoadingIndicator,
  } = useComponentContext<StreamChatGenerics>();
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
