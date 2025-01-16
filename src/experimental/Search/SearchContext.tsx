import React, { createContext, PropsWithChildren, useContext } from 'react';
import type { SearchController } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../types';

export type SearchContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** The type of channel to create on user result select, defaults to `messaging` */
  directMessagingChannelType: string;
  searchController: SearchController<StreamChatGenerics>;
  /** Sets the input element into disabled state */
  disabled?: boolean;
  // /** Clear search state / results on every click outside the search input, defaults to true */
  exitSearchOnInputBlur?: boolean;
  // todo: document this is not available - better override search result item
  /** Custom handler function to run on search result item selection */
  // onSelectResult?: (
  //   params: ChannelSearchFunctionParams<StreamChatGenerics>,
  //   result: ChannelOrUserResponse<StreamChatGenerics>,
  // ) => Promise<void> | void;
  /** Custom placeholder text to be displayed in the search input */
  placeholder?: string;
};

export const SearchContext = createContext<SearchContextValue | undefined>(undefined);

/**
 * Context provider for components rendered within the `Search` component
 */
export const SearchContextProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  children,
  value,
}: PropsWithChildren<{
  value: SearchContextValue<StreamChatGenerics>;
}>) => (
  <SearchContext.Provider value={(value as unknown) as SearchContextValue}>
    {children}
  </SearchContext.Provider>
);

export const useSearchContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const contextValue = useContext(SearchContext);
  return (contextValue as unknown) as SearchContextValue<StreamChatGenerics>;
};
