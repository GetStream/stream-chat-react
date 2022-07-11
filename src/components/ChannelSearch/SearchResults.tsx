import React, { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { ChannelOrUserResponse, isChannel } from './utils';
import { Avatar } from '../Avatar';

import { useTranslationContext } from '../../context';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type DropdownContainerProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  results: ChannelOrUserResponse<StreamChatGenerics>[];
  SearchResultItem: React.ComponentType<SearchResultItemProps<StreamChatGenerics>>;
  selectResult: (result: ChannelOrUserResponse<StreamChatGenerics>) => Promise<void> | void;
  focusedUser?: number;
};

const DefaultDropdownContainer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: DropdownContainerProps<StreamChatGenerics>,
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
> = {
  index: number;
  result: ChannelOrUserResponse<StreamChatGenerics>;
  selectResult: (result: ChannelOrUserResponse<StreamChatGenerics>) => Promise<void> | void;
  focusedUser?: number;
};

const DefaultSearchResultItem = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: SearchResultItemProps<StreamChatGenerics>,
) => {
  const { focusedUser, index, result, selectResult } = props;

  const focused = focusedUser === index;

  if (isChannel(result)) {
    const channel = result;

    return (
      <button
        aria-label={`Select Channel: ${channel.data?.name || ''}`}
        className={`str-chat__channel-search-result ${focused ? 'focused' : ''}`}
        onClick={() => selectResult(channel)}
      >
        <div className='result-hashtag'>#</div>
        <p className='channel-search__result-text'>{channel.data?.name}</p>
      </button>
    );
  } else {
    return (
      <button
        aria-label={`Select User Channel: ${result.name || ''}`}
        className={`str-chat__channel-search-result ${focused ? 'focused' : ''}`}
        onClick={() => selectResult(result)}
      >
        <Avatar image={result.image} user={result} />
        {result.name || result.id}
      </button>
    );
  }
};

const ResultsContainer = ({
  children,
  popupResults,
}: PropsWithChildren<{ popupResults?: boolean }>) => {
  const containerStyle = popupResults ? 'popup' : 'inline';
  return <div className={`str-chat__channel-search-container ${containerStyle}`}>{children}</div>;
};

export type SearchResultsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  results: Array<ChannelOrUserResponse<StreamChatGenerics>> | [];
  searching: boolean;
  selectResult: (result: ChannelOrUserResponse<StreamChatGenerics>) => Promise<void> | void;
  DropdownContainer?: React.ComponentType<DropdownContainerProps<StreamChatGenerics>>;
  popupResults?: boolean;
  SearchEmpty?: React.ComponentType;
  SearchLoading?: React.ComponentType;
  SearchResultItem?: React.ComponentType<SearchResultItemProps<StreamChatGenerics>>;
  SearchResultsHeader?: React.ComponentType;
};

export const SearchResults = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: SearchResultsProps<StreamChatGenerics>,
) => {
  const {
    DropdownContainer = DefaultDropdownContainer,
    popupResults,
    results,
    searching,
    SearchEmpty,
    SearchResultsHeader,
    SearchLoading,
    SearchResultItem = DefaultSearchResultItem,
    selectResult,
  } = props;

  const { t } = useTranslationContext('SearchResults');
  const [focusedUser, setFocusedUser] = useState<number>();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        setFocusedUser((prevFocused) => {
          if (prevFocused === undefined) return 0;
          return prevFocused === 0 ? results.length - 1 : prevFocused - 1;
        });
      }

      if (event.key === 'ArrowDown') {
        setFocusedUser((prevFocused) => {
          if (prevFocused === undefined) return 0;
          return prevFocused === results.length - 1 ? 0 : prevFocused + 1;
        });
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        if (focusedUser !== undefined) {
          selectResult(results[focusedUser]);
          return setFocusedUser(undefined);
        }
      }
    },
    [focusedUser],
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
          <div className='str-chat__channel-search-container-searching'>
            {t<string>('Searching...')}
          </div>
        )}
      </ResultsContainer>
    );
  }

  if (!results.length) {
    return (
      <ResultsContainer popupResults={popupResults}>
        {SearchEmpty ? (
          <SearchEmpty />
        ) : (
          <div aria-live='polite' className='str-chat__channel-search-container-empty'>
            {t<string>('No results found')}
          </div>
        )}
      </ResultsContainer>
    );
  }

  return (
    <ResultsContainer popupResults={popupResults}>
      {SearchResultsHeader && <SearchResultsHeader />}
      <DropdownContainer
        focusedUser={focusedUser}
        results={results}
        SearchResultItem={SearchResultItem}
        selectResult={selectResult}
      />
    </ResultsContainer>
  );
};
