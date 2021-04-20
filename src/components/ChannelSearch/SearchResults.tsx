import React from 'react';

import { Avatar } from '../Avatar/Avatar';

import { useTranslationContext } from '../../context/TranslationContext';

import type { UserResponse } from 'stream-chat';

import type { DefaultUserType } from '../../../types/types';

export type SearchResultProps<Us extends DefaultUserType<Us> = DefaultUserType> = {
  index: number;
  result: UserResponse<Us>;
  selectResult: (user: UserResponse<Us>) => Promise<void>;
};

const DefaultSearchResult = <Us extends DefaultUserType<Us> = DefaultUserType>(
  props: SearchResultProps<Us>,
) => {
  const { result, selectResult } = props;

  return (
    <div className='str-chat__channel-search-result' onClick={() => selectResult(result)}>
      <Avatar image={result.image} />
      {result.name || result.id}
    </div>
  );
};

export type SearchResultsProps<Us extends DefaultUserType<Us> = DefaultUserType> = {
  results: UserResponse<Us>[];
  searching: boolean;
  selectResult: (user: UserResponse<Us>) => Promise<void>;
  popupResults?: boolean;
  SearchEmpty?: React.ComponentType;
  SearchLoading?: React.ComponentType;
  SearchResult?: React.ComponentType<SearchResultProps<Us>>;
};

export const SearchResults = <Us extends DefaultUserType<Us> = DefaultUserType>(
  props: SearchResultsProps<Us>,
) => {
  const {
    popupResults,
    results,
    searching,
    SearchEmpty,
    SearchLoading,
    SearchResult = DefaultSearchResult,
    selectResult,
  } = props;

  const { t } = useTranslationContext();

  const containerStyle = popupResults ? 'popup' : 'inline';

  const ResultsContainer: React.FC = ({ children }) => (
    <div className={`str-chat__channel-search-container ${containerStyle}`}>{children}</div>
  );

  if (searching) {
    return (
      <ResultsContainer>
        {SearchLoading ? <SearchLoading /> : t('Results loading...')}
      </ResultsContainer>
    );
  }

  if (!results.length) {
    return (
      <ResultsContainer>{SearchEmpty ? <SearchEmpty /> : t('No results found')}</ResultsContainer>
    );
  }

  return (
    <ResultsContainer>
      {results.map((result, index) => (
        <SearchResult index={index} key={result.id} result={result} selectResult={selectResult} />
      ))}
    </ResultsContainer>
  );
};
