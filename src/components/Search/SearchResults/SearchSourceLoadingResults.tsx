import React from 'react';
import { useTranslationContext } from '../../../context';
import { DefaultSearchSources, SearchSource } from '../SearchController';
import type { DefaultStreamChatGenerics } from '../../../types';

export type SearchSourceLoadingResultsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> = {
  searchSource: Sources[number];
};

export const SearchSourceLoadingResults = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>({
  searchSource,
}: SearchSourceLoadingResultsProps<StreamChatGenerics, Sources>) => {
  const { t } = useTranslationContext();

  return (
    <div
      className='str-chat__channel-search-container-searching'
      data-testid='search-in-progress-indicator'
    >
      {t<string>(`Searching for ${searchSource.type}...`)}
    </div>
  );
};
