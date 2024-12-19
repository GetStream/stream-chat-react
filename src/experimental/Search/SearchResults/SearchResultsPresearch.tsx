import React from 'react';
import { DefaultSearchSources, SearchSource } from '../SearchController';
import { useTranslationContext } from '../../../context';
import type { DefaultStreamChatGenerics } from '../../../types';

export type SearchResultsPresearchProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> = {
  activeSources: Array<Sources[number]>;
};

export const SearchResultsPresearch = () => {
  const { t } = useTranslationContext();
  return (
    <div className='str-chat__search-results-presearch'>{t<string>('Start typing to search')}</div>
  );
};
