import React from 'react';

import { useTranslationContext } from '../../../context';

import type { SearchSource } from 'stream-chat';

export type SearchResultsPresearchProps = {
  activeSources: SearchSource[];
};

export const SearchResultsPresearch = () => {
  const { t } = useTranslationContext();
  return (
    <div className='str-chat__search-results-presearch'>
      {t('Start typing to search')}
    </div>
  );
};
