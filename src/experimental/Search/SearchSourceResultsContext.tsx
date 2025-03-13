import type { PropsWithChildren } from 'react';
import React, { createContext, useContext } from 'react';
import type { SearchSource } from 'stream-chat';

export type SearchSourceResultsContextValue = {
  searchSource: SearchSource;
};

export const SearchSourceResultsContext = createContext<
  SearchSourceResultsContextValue | undefined
>(undefined);

/**
 * Context provider for components rendered within the `SearchSourceResults`
 */
export const SearchSourceResultsContextProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: SearchSourceResultsContextValue;
}>) => (
  <SearchSourceResultsContext.Provider
    value={value as unknown as SearchSourceResultsContextValue}
  >
    {children}
  </SearchSourceResultsContext.Provider>
);

export const useSearchSourceResultsContext = () => {
  const contextValue = useContext(SearchSourceResultsContext);
  return contextValue as unknown as SearchSourceResultsContextValue;
};
