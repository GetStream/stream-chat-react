import React, { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import type { SearchController } from 'stream-chat';

export type SearchContextValue = {
  /** The type of channel to create on user result select, defaults to `messaging` */
  directMessagingChannelType: string;
  /** Instance of the search controller that handles the data management */
  searchController: SearchController;
  /** Sets the input element into disabled state */
  disabled?: boolean;
  /** Clear search state / results on every click outside the search input, defaults to true */
  exitSearchOnInputBlur?: boolean;
  /** Custom placeholder text to be displayed in the search input */
  placeholder?: string;
};

export const SearchContext = createContext<SearchContextValue | undefined>(undefined);

/**
 * Context provider for components rendered within the `Search` component
 */
export const SearchContextProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: SearchContextValue;
}>) => (
  <SearchContext.Provider value={value as unknown as SearchContextValue}>
    {children}
  </SearchContext.Provider>
);

export const useSearchContext = () => {
  const contextValue = useContext(SearchContext);
  return contextValue as unknown as SearchContextValue;
};
