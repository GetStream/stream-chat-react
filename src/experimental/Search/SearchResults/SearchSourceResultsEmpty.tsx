import React from 'react';
import { useTranslationContext } from '../../../context';

export const SearchSourceResultsEmpty = () => {
  const { t } = useTranslationContext();
  return (
    <div className='str-chat__search-source-results-empty'>{t<string>('No results found')}</div>
  );
};
