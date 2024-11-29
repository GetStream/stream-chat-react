import React from 'react';
import { DefaultSearchSources, SearchSource } from '../SearchController';
import { useSearchContext, useTranslationContext } from '../../../context';

export type SearchSourceEmptyResultsProps<Sources extends SearchSource[] = DefaultSearchSources> = {
  searchSource: Sources[number]['type'];
};

export const SearchSourceEmptyResults = <Sources extends SearchSource[] = DefaultSearchSources>({
  searchSource,
}: SearchSourceEmptyResultsProps<Sources>) => {
  const { t } = useTranslationContext();
  const { searchController } = useSearchContext<Sources>();
  if (searchController.sourceLastQueryError(searchSource)) {
    return <div>{t<string>('Failed to load search results')}</div>;
  }

  return <div>{t<string>('No results found')}</div>;
};
