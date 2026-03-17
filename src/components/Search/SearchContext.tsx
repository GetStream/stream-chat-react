import React, { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import type { SearchController } from 'stream-chat';
import type { SearchProps } from './Search';

export type SearchContextValue = {
  /** Instance of the search controller that handles the data management */
  searchController: SearchController;
  /** Reference to the container element of the search component */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Reference to the container element of the filter buttons */
  filterButtonsContainerRef: React.RefObject<HTMLDivElement | null>;
} & Pick<SearchProps, 'disabled' | 'placeholder'> &
  Required<Pick<SearchProps, 'exitSearchOnInputBlur' | 'directMessagingChannelType'>>;

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
