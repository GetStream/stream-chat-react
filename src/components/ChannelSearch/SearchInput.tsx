import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';

import type { ChannelOrUserResponse } from './utils';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type ChannelSearchFunctionParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  setResults: React.Dispatch<
    React.SetStateAction<Array<ChannelOrUserResponse<StreamChatGenerics>>>
  >;
  setResultsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
};

export type SearchInputProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  channelSearchParams: {
    setQuery: React.Dispatch<React.SetStateAction<string>>;
    setResults: React.Dispatch<React.SetStateAction<ChannelOrUserResponse<StreamChatGenerics>[]>>;
    setResultsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSearching: React.Dispatch<React.SetStateAction<boolean>>;
  };
  inputRef: React.RefObject<HTMLInputElement>;
  onSearch: (event: React.BaseSyntheticEvent) => void;
  query: string;
  /** Custom placeholder text to be displayed in the search input */
  placeholder?: string;
  searchFunction?: (
    params: ChannelSearchFunctionParams<StreamChatGenerics>,
    event: React.BaseSyntheticEvent,
  ) => Promise<void> | void;
};

export const SearchInput = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: SearchInputProps<StreamChatGenerics>,
) => {
  const { channelSearchParams, inputRef, onSearch, placeholder, query, searchFunction } = props;

  const { t } = useTranslationContext('SearchInput');

  return (
    <input
      className='str-chat__channel-search-input'
      onChange={(event: React.BaseSyntheticEvent) =>
        searchFunction ? searchFunction(channelSearchParams, event) : onSearch(event)
      }
      placeholder={placeholder || t('Search')}
      ref={inputRef}
      type='text'
      value={query}
    />
  );
};
