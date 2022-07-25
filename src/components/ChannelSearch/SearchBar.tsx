import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

import {
  MenuIcon as DefaultMenuIcon,
  SearchIcon as DefaultSearchInputIcon,
  ReturnIcon,
  XIcon,
} from './icons';
import { SearchInput as DefaultSearchInput, SearchInputProps } from './SearchInput';

export type AdditionalSearchBarProps = {
  /** Custom icon component used to clear the input value on click. Displayed within the search input wrapper. */
  ClearInputIcon?: React.ComponentType;
  /** Custom icon component used to terminate the search UI session on click. */
  ExitSearchIcon?: React.ComponentType;
  /** Custom icon component used to invoke context menu. */
  MenuIcon?: React.ComponentType;
  /** Custom UI component to display the search text input */
  SearchInput?: React.ComponentType<SearchInputProps>;
  /** Custom icon used to indicate search input. */
  SearchInputIcon?: React.ComponentType;
};

export type SearchBarProps = AdditionalSearchBarProps & SearchInputProps;

// todo: add context menu control logic
export const SearchBar = (props: SearchBarProps) => {
  const {
    ClearInputIcon = XIcon,
    ExitSearchIcon = ReturnIcon,
    MenuIcon = DefaultMenuIcon,
    SearchInput = DefaultSearchInput,
    SearchInputIcon = DefaultSearchInputIcon,
    ...inputProps
  } = props;
  const [inputIsFocused, setInputIsFocused] = useState(false);

  useEffect(() => {
    const handleFocus = () => {
      setInputIsFocused(true);
    };
    const handleBlur = (e: Event) => {
      e.stopPropagation();
    };
    props.inputRef.current?.addEventListener('focus', handleFocus);
    props.inputRef.current?.addEventListener('blur', handleBlur);
    return () => {
      props.inputRef.current?.removeEventListener('focus', handleFocus);
      props.inputRef.current?.addEventListener('blur', handleBlur);
    };
  }, []);

  return (
    <div className='str-chat__channel-search-bar'>
      <button
        className='str-chat__channel-search-bar--menu-button'
        data-testid='search-bar-button'
        onClick={() => {
          setInputIsFocused(false);
          inputProps.inputRef.current?.blur();
          inputProps.clearState();
        }}
      >
        {inputIsFocused ? <ExitSearchIcon /> : <MenuIcon />}
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
        <div
          className='str-chat__channel-search-input--clear-icon'
          data-testid='clear-input-button'
          onClick={() => {
            inputProps.clearState();
            inputProps.inputRef.current?.focus();
          }}
        >
          <ClearInputIcon />
        </div>
      </div>
    </div>
  );
};
