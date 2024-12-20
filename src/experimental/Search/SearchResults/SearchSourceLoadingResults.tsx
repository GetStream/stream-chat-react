import React from 'react';
import { useTranslationContext } from '../../../context';
import { useSearchSourceResultsContext } from '../SearchSourceResultsContext';

export const SearchSourceLoadingResults = () => {
  const { t } = useTranslationContext();
  const { searchSource } = useSearchSourceResultsContext();
  return (
    <div
      className='str-chat__channel-search-container-searching'
      data-testid='search-in-progress-indicator'
    >
      {t<string>(`Searching for ${searchSource.type}...`)}
    </div>
  );
};
