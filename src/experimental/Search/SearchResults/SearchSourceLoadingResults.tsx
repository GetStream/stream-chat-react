import React from 'react';
import { useTranslationContext } from '../../../context';
import { SearchSource } from '../SearchController';

export type SearchSourceLoadingResultsProps = {
  searchSource: SearchSource;
};

export const SearchSourceLoadingResults = ({ searchSource }: SearchSourceLoadingResultsProps) => {
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
