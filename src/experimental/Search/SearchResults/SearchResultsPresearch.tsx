import React from 'react';
import { SearchSource } from '../SearchController';
import { useTranslationContext } from '../../../context';

export type SearchResultsPresearchProps = {
  activeSources: SearchSource[];
};

export const SearchResultsPresearch = () => {
  const { t } = useTranslationContext();
  return (
    <div className='str-chat__search-results-presearch'>{t<string>('Start typing to search')}</div>
  );
};
