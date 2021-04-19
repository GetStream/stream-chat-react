import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';

import type { UserResponse } from 'stream-chat';

import type { DefaultUserType } from '../../../types/types';
import { Avatar } from '../Avatar';

export type SearchResultProps<Us extends DefaultUserType<Us> = DefaultUserType> = {
  index: number;
  result: UserResponse<Us>;
};

const SearchResult = <Us extends DefaultUserType<Us> = DefaultUserType>(
  props: SearchResultProps<Us>,
) => {
  const { result } = props;

  return (
    <div className='str-chat__channel-search-result'>
      <Avatar image={result.image} />
      {result.name || result.id}
    </div>
  );
};

export type SearchResultsProps<Us extends DefaultUserType<Us> = DefaultUserType> = {
  results: UserResponse<Us>[];
  searching: boolean;
  popupResults?: boolean;
};

export const SearchResults = <Us extends DefaultUserType<Us> = DefaultUserType>(
  props: SearchResultsProps<Us>,
) => {
  const { popupResults, results, searching } = props;

  const { t } = useTranslationContext();

  const ResultsContainer: React.FC = ({ children }) => (
    <div className={`str-chat__channel-search-container ${popupResults ? 'popup' : ''}`}>
      {children}
    </div>
  );

  if (searching) {
    return <ResultsContainer>{t('Results loading...')}</ResultsContainer>;
  }

  if (!results.length) {
    return <ResultsContainer>{t('No results found')}</ResultsContainer>;
  }

  return (
    <ResultsContainer>
      {results.map((result, index) => (
        <SearchResult index={index} key={result.id} result={result} />
      ))}
    </ResultsContainer>
  );
};
