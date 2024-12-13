import React from 'react';
import { DefaultSearchSources, SearchSource } from '../SearchController';
import { useTranslationContext } from '../../../context';
import type { DefaultStreamChatGenerics } from '../../../types';

export type SearchSourceEmptyResultsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> = {
  searchSource: Sources[number];
};

export const SearchSourceEmptyResults = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>({
  searchSource,
}: SearchSourceEmptyResultsProps<StreamChatGenerics, Sources>) => {
  const { t } = useTranslationContext();
  if (searchSource?.lastQueryError) {
    return <div>{t<string>('Failed to load search results')}</div>;
  }

  return <div>{t<string>('No results found')}</div>;
};
