import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';

import type { ChannelSearchProps } from './ChannelSearch';
import type { SearchControllerState } from './hooks/useChannelSearch';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type SearchInputProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Pick<
  SearchControllerState<StreamChatGenerics>,
  'channelSearchParams' | 'clearState' | 'inputRef' | 'onSearch' | 'query'
> &
  Pick<ChannelSearchProps<StreamChatGenerics>, 'searchFunction'> & {
    /** Custom placeholder text to be displayed in the search input */
    placeholder?: string;
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
      placeholder={placeholder ?? t('Search')}
      ref={inputRef}
      type='text'
      value={query}
    />
  );
};
