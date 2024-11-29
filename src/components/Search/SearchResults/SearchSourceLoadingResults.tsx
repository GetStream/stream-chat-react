import React from 'react';
import { useTranslationContext } from '../../../context';
import { DefaultSearchSources, SearchSource } from '../SearchController';

export type SearchSourceLoadingResultsProps<Sources extends SearchSource[]> = {
  searchSource: Sources[number]['type'];
};

export const SearchSourceLoadingResults = <Sources extends SearchSource[] = DefaultSearchSources>({
  searchSource,
}: SearchSourceLoadingResultsProps<Sources>) => {
  const { t } = useTranslationContext();

  return (
    <div
      className='str-chat__channel-search-container-searching'
      data-testid='search-in-progress-indicator'
    >
      {t<string>(`Searching for ${searchSource}...`)}
    </div>
  );
};
