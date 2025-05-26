import React from 'react';
import { useTranslationContext } from '../../../context';
import { useSearchSourceResultsContext } from '../SearchSourceResultsContext';

export const SearchSourceResultsLoadingIndicator = () => {
  const { t } = useTranslationContext();
  const { searchSource } = useSearchSourceResultsContext();
  return (
    <div
      className='str-chat__search-source-results__loading-indicator'
      data-testid='search-loading-indicator'
    >
      {t(`Searching for ${searchSource.type}...`)}
    </div>
  );
};
