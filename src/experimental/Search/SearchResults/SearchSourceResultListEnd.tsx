import React from 'react';
import { useTranslationContext } from '../../../context';
import type { SearchSource } from '../SearchController';

export type SearchSourceResultListEndProps = {
  searchSource: SearchSource;
};

export const SearchSourceResultListEnd = () => {
  const { t } = useTranslationContext();
  return (
    <div className='str-chat__search-source-empty-results'>{t<string>('All results loaded')}</div>
  );
};
