import React from 'react';
import clsx from 'clsx';

import { SearchInput } from './SearchInput';
import {
  MenuIcon as DefaultMenuIcon,
  SearchInputIcon as DefaultSearchInputIcon,
  ReturnIcon,
  XIcon,
} from './icons';

import { useChatContext } from '../../context/ChatContext';

import type { SearchInputProps } from './SearchInput';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type SearchBarProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  ClearIcon?: React.ComponentType;
  HideSearchResultsIcon?: React.ComponentType;
  MenuIcon?: React.ComponentType;
  SearchInputIcon?: React.ComponentType;
} & SearchInputProps<StreamChatGenerics>;

const TheSearchBar = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: SearchBarProps<StreamChatGenerics>,
) => {
  const {
    ClearIcon = XIcon,
    HideSearchResultsIcon = ReturnIcon,
    MenuIcon = DefaultMenuIcon,
    SearchInputIcon = DefaultSearchInputIcon,
    ...inputProps
  } = props;

  return (
    <div className='str-chat__channel-search-bar'>
      <button className='str-chat__channel-search-bar--menu-button'>
        {props.query ? <HideSearchResultsIcon /> : <MenuIcon />}
      </button>
      <div
        className={clsx(
          'str-chat__channel-search-input--wrapper',
          inputProps.query && 'str-chat__channel-search-input--wrapper-active',
        )}
      >
        <div className='str-chat__channel-search-input--icon'>
          <SearchInputIcon />
        </div>
        <SearchInput {...inputProps} />
        <div className='str-chat__channel-search-input--clear-icon' onClick={inputProps.clearState}>
          <ClearIcon />
        </div>
      </div>
    </div>
  );
};

export const SearchBar = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: SearchBarProps<StreamChatGenerics>,
) => {
  const { themeVersion } = useChatContext();
  return themeVersion === '2' ? <TheSearchBar {...props} /> : <SearchInput {...props} />;
};
