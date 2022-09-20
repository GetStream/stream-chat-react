import React, { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';

import { SearchIcon } from './icons';
import { ChannelPreview } from '../ChannelPreview';
import { ChannelOrUserResponse, isChannel } from './utils';
import { Avatar } from '../Avatar';

import { useChatContext, useTranslationContext } from '../../context';

import type { DefaultStreamChatGenerics } from '../../types/types';

const DefaultSearchEmpty = () => {
  const { t } = useTranslationContext('SearchResults');
  return (
    <div aria-live='polite' className='str-chat__channel-search-container-empty'>
      <SearchIcon />
      {t<string>('No results found')}
    </div>
  );
};

export type SearchResultsHeaderProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Pick<SearchResultsProps<StreamChatGenerics>, 'results'>;

const DefaultSearchResultsHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  results,
}: SearchResultsHeaderProps<StreamChatGenerics>) => {
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

export type SearchResultsListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Pick<
  SearchResultsProps<StreamChatGenerics>,
  'results' | 'SearchResultItem' | 'selectResult'
> & {
  focusedUser?: number;
};

const DefaultSearchResultsList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: SearchResultsListProps<StreamChatGenerics>,
) => {
  const { focusedUser, results, SearchResultItem = DefaultSearchResultItem, selectResult } = props;

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

export type SearchResultItemProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Pick<SearchResultsProps<StreamChatGenerics>, 'selectResult'> & {
  index: number;
  result: ChannelOrUserResponse<StreamChatGenerics>;
  focusedUser?: number;
};

const DefaultSearchResultItem = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: SearchResultItemProps<StreamChatGenerics>,
) => {
  const { focusedUser, index, result, selectResult } = props;
  const focused = focusedUser === index;
  const { themeVersion } = useChatContext();

  const className = clsx(
    'str-chat__channel-search-result',
    focused && 'str-chat__channel-search-result--focused focused',
  );

  if (isChannel(result)) {
    const channel = result;

    return themeVersion === '2' ? (
      <ChannelPreview
        channel={channel}
        className={className}
        onSelect={() => selectResult(channel)}
      />
    ) : (
      <button
        aria-label={`Select Channel: ${channel.data?.name || ''}`}
        className={className}
        data-testid='channel-search-result-channel'
        onClick={() => selectResult(channel)}
        role='option'
      >
        <div className='result-hashtag'>#</div>
        <p className='channel-search__result-text'>{channel.data?.name}</p>
      </button>
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
          image={result.image}
          name={result.name || result.id}
          size={themeVersion === '2' ? 40 : undefined}
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
}: PropsWithChildren<{ popupResults?: boolean }>) => (
  <div
    aria-label='Channel search results'
    className={clsx(
      `str-chat__channel-search-container str-chat__channel-search-result-list`,
      popupResults ? 'popup' : 'inline',
    )}
  >
    {children}
  </div>
);

export type SearchResultsController<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  results: Array<ChannelOrUserResponse<StreamChatGenerics>> | [];
  searching: boolean;
  selectResult: (result: ChannelOrUserResponse<StreamChatGenerics>) => Promise<void> | void;
};

export type AdditionalSearchResultsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** Display search results as an absolutely positioned popup, defaults to false and shows inline */
  popupResults?: boolean;
  /** Custom UI component to display empty search results */
  SearchEmpty?: React.ComponentType;
  /** Custom UI component to display the search loading state */
  SearchLoading?: React.ComponentType;
  /** Custom UI component to display a search result list item, defaults to and accepts the same props as: [DefaultSearchResultItem](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelSearch/SearchResults.tsx) */
  SearchResultItem?: React.ComponentType<SearchResultItemProps<StreamChatGenerics>>;
  /** Custom UI component to display the search results header */
  SearchResultsHeader?: React.ComponentType;
  /** Custom UI component to display all the search results, defaults to and accepts the same props as: [DefaultSearchResultsList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelSearch/SearchResults.tsx)  */
  SearchResultsList?: React.ComponentType<SearchResultsListProps<StreamChatGenerics>>;
};

export type SearchResultsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = AdditionalSearchResultsProps<StreamChatGenerics> & SearchResultsController<StreamChatGenerics>;

export const SearchResults = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: SearchResultsProps<StreamChatGenerics>,
) => {
  const {
    popupResults,
    results,
    searching,
    SearchEmpty = DefaultSearchEmpty,
    SearchResultsHeader = DefaultSearchResultsHeader,
    SearchLoading,
    SearchResultItem = DefaultSearchResultItem,
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
        if (focusedResult !== undefined) {
          selectResult(results[focusedResult]);
          return setFocusedResult(undefined);
        }
      }
    },
    [focusedResult],
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
