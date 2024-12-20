import React from 'react';
import { SearchSource } from '../SearchController';
import { useTranslationContext } from '../../../context';

export type SearchSourceResultsEmptyProps = {
  searchSource: SearchSource;
};

export const SearchSourceResultsEmpty = () => {
  const { t } = useTranslationContext();
  return (
    <div className='str-chat__search-source-results-empty'>{t<string>('No results found')}</div>
  );
};
