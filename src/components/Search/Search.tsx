import clsx from 'clsx';
import React, { useRef } from 'react';
import type { SearchControllerState } from 'stream-chat';

import { SearchBar as DefaultSearchBar } from './SearchBar/SearchBar';
import { SearchResults as DefaultSearchResults } from './SearchResults/SearchResults';
import { SearchContextProvider } from './SearchContext';
import { useChatContext, useComponentContext } from '../../context';
import { useStateStore } from '../../store';

type SearchControllerStateSelectorReturnValue = {
  isActive: boolean;
};

const searchControllerStateSelector = (
  nextValue: SearchControllerState,
): SearchControllerStateSelectorReturnValue => ({ isActive: nextValue.isActive });

export type SearchProps = {
  /** Type of the channel created when a user result is selected. Defaults to `messaging`. */
  directMessagingChannelType?: string;
  /** Disables the search input. */
  disabled?: boolean;
  /** Exits search (clearing query and results) when focus leaves the widget. Defaults to false. */
  exitSearchOnInputBlur?: boolean;
  /**
   * Props spread onto the search `<input>`, e.g. to opt out of password managers or to add `name`.
   * The component's own props, such as `aria-label`, `disabled`, `onBlur`, `onChange`, `type` and
   * `value`, take precedence; `className` is merged.
   */
  inputProps?: React.ComponentPropsWithoutRef<'input'>;
  /** Placeholder of the search input. Defaults to the translated "Search". */
  placeholder?: string;
};

export const Search = ({
  directMessagingChannelType = 'messaging',
  disabled,
  exitSearchOnInputBlur = false,
  inputProps,
  placeholder,
}: SearchProps) => {
  const { SearchBar = DefaultSearchBar, SearchResults = DefaultSearchResults } =
    useComponentContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const filterButtonsContainerRef = useRef<HTMLDivElement | null>(null);

  const { searchController } = useChatContext();

  const { isActive } = useStateStore<
    SearchControllerState,
    SearchControllerStateSelectorReturnValue
  >(searchController.state, searchControllerStateSelector);

  return (
    <SearchContextProvider
      value={{
        containerRef,
        directMessagingChannelType,
        disabled,
        exitSearchOnInputBlur,
        filterButtonsContainerRef,
        inputProps,
        placeholder,
        searchController,
      }}
    >
      <div
        className={clsx('str-chat__search', {
          'str-chat__search--active': isActive,
        })}
        data-testid='search'
        ref={containerRef}
      >
        <SearchBar />
        <SearchResults />
      </div>
    </SearchContextProvider>
  );
};
