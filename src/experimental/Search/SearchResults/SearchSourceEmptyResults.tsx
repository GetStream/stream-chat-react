import React from 'react';
import { SearchSource } from '../SearchController';
import { useTranslationContext } from '../../../context';

export type SearchSourceEmptyResultsProps = {
  searchSource: SearchSource;
};

export const SearchSourceEmptyResults = () => {
  const { t } = useTranslationContext();
  return (
    <div className='str-chat__search-source-empty-results'>{t<string>('No results found')}</div>
  );
};
