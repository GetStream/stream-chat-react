import type { PropsWithChildren } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';

import { SearchIcon } from './icons';
import { ChannelPreview } from '../ChannelPreview';
import type { ChannelOrUserResponse } from './utils';
import { isChannel } from './utils';
import { Avatar } from '../Avatar';

import { useTranslationContext } from '../../context';

const DefaultSearchEmpty = () => {
  const { t } = useTranslationContext('SearchResults');
  return (
    <div aria-live='polite' className='str-chat__channel-search-container-empty'>
      <SearchIcon />
      {t<string>('No results found')}
    </div>
  );
};

export type SearchResultsHeaderProps = Pick<SearchResultsProps, 'results'>;

const DefaultSearchResultsHeader = ({ results }: SearchResultsHeaderProps) => {
  const { t } = useTranslationContext('SearchResultsHeader');
  return (
    <div
      className='str-chat__channel-search-results-header'
      data-testid='channel-search-results-header'
    >
      {t<string>('searchResultsCount', {
        count: results.length,
      })}
    </div>
  );
};

export type SearchResultsListProps = Required<
  Pick<SearchResultsProps, 'results' | 'SearchResultItem' | 'selectResult'>
> & {
  focusedUser?: number;
};

const DefaultSearchResultsList = (props: SearchResultsListProps) => {
  const { focusedUser, results, SearchResultItem, selectResult } = props;

  return (
    <>
      {results.map((result, index) => (
        <SearchResultItem
          focusedUser={focusedUser}
          index={index}
          key={index}
          result={result}
          selectResult={selectResult}
        />
      ))}
    </>
  );
};

// fixme: index and focusedUser should be changed for className with default value "str-chat__channel-search-result--focused"
export type SearchResultItemProps = Pick<SearchResultsProps, 'selectResult'> & {
  index: number;
  result: ChannelOrUserResponse;
  focusedUser?: number;
};

const DefaultSearchResultItem = (props: SearchResultItemProps) => {
  const { focusedUser, index, result, selectResult } = props;
  const focused = focusedUser === index;

  const className = clsx(
    'str-chat__channel-search-result',
    focused && 'str-chat__channel-search-result--focused',
  );

  if (isChannel(result)) {
    const channel = result;

    return (
      <ChannelPreview
        channel={channel}
        className={className}
        onSelect={() => selectResult(channel)}
      />
    );
  } else {
    return (
      <button
        aria-label={`Select User Channel: ${result.name || ''}`}
        className={className}
        data-testid='channel-search-result-user'
        onClick={() => selectResult(result)}
        role='option'
      >
        <Avatar
          className='str-chat__avatar--channel-preview'
          image={result.image}
          name={result.name || result.id}
          user={result}
        />
        <div className='str-chat__channel-search-result--display-name'>
          {result.name || result.id}
        </div>
      </button>
    );
  }
};

const ResultsContainer = ({
  children,
  popupResults,
}: PropsWithChildren<{ popupResults?: boolean }>) => {
  const { t } = useTranslationContext('ResultsContainer');

  return (
    <div
      aria-label={t('aria/Channel search results')}
      className={clsx(
        `str-chat__channel-search-result-list`,
        popupResults ? 'popup' : 'inline',
      )}
    >
      {children}
    </div>
  );
};

export type SearchResultsController = {
  results: Array<ChannelOrUserResponse>;
  searching: boolean;
  selectResult: (result: ChannelOrUserResponse) => Promise<void> | void;
};

export type AdditionalSearchResultsProps = {
  /** Display search results as an absolutely positioned popup, defaults to false and shows inline */
  popupResults?: boolean;
  /** Custom UI component to display empty search results */
  SearchEmpty?: React.ComponentType;
  /** Custom UI component to display the search loading state */
  SearchLoading?: React.ComponentType;
  /** Custom UI component to display a search result list item, defaults to and accepts the same props as: [DefaultSearchResultItem](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelSearch/SearchResults.tsx) */
  SearchResultItem?: React.ComponentType<SearchResultItemProps>;
  /** Custom UI component to display the search results header */
  SearchResultsHeader?: React.ComponentType;
  /** Custom UI component to display all the search results, defaults to and accepts the same props as: [DefaultSearchResultsList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelSearch/SearchResults.tsx)  */
  SearchResultsList?: React.ComponentType<SearchResultsListProps>;
};

export type SearchResultsProps = AdditionalSearchResultsProps & SearchResultsController;

export const SearchResults = (props: SearchResultsProps) => {
  const {
    popupResults,
    results,
    SearchEmpty = DefaultSearchEmpty,
    searching,
    SearchLoading,
    SearchResultItem = DefaultSearchResultItem,
    SearchResultsHeader = DefaultSearchResultsHeader,
    SearchResultsList = DefaultSearchResultsList,
    selectResult,
  } = props;

  const { t } = useTranslationContext('SearchResults');
  const [focusedResult, setFocusedResult] = useState<number>();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        setFocusedResult((prevFocused) => {
          if (prevFocused === undefined) return 0;
          return prevFocused === 0 ? results.length - 1 : prevFocused - 1;
        });
      }

      if (event.key === 'ArrowDown') {
        setFocusedResult((prevFocused) => {
          if (prevFocused === undefined) return 0;
          return prevFocused === results.length - 1 ? 0 : prevFocused + 1;
        });
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        setFocusedResult((prevFocused) => {
          if (typeof prevFocused !== 'undefined') {
            selectResult(results[prevFocused]);
            return undefined;
          }
          return prevFocused;
        });
      }
    },
    [results, selectResult],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (searching) {
    return (
      <ResultsContainer popupResults={popupResults}>
        {SearchLoading ? (
          <SearchLoading />
        ) : (
          <div
            className='str-chat__channel-search-container-searching'
            data-testid='search-in-progress-indicator'
          >
            {t<string>('Searching...')}
          </div>
        )}
      </ResultsContainer>
    );
  }

  if (!results.length) {
    return (
      <ResultsContainer popupResults={popupResults}>
        <SearchEmpty />
      </ResultsContainer>
    );
  }

  return (
    <ResultsContainer popupResults={popupResults}>
      <SearchResultsHeader results={results} />
      <SearchResultsList
        focusedUser={focusedResult}
        results={results}
        SearchResultItem={SearchResultItem}
        selectResult={selectResult}
      />
    </ResultsContainer>
  );
};
