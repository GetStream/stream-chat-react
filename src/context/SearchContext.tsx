import React, { createContext, PropsWithChildren, useContext } from 'react';
import {
  DefaultSearchSources,
  SearchController,
  SearchSource,
} from '../components/Search/SearchController';
import type { DefaultStreamChatGenerics } from '../types';

export type SearchContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> = {
  searchController: SearchController<StreamChatGenerics, Sources>;
  /** The type of channel to create on user result select, defaults to `messaging` */
  userToUserCreatedChannelType: string;
  /** Sets the input element into disabled state */
  disabled?: boolean;
  // /** Clear search state / results on every click outside the search input, defaults to true */
  exitSearchOnInputBlur?: boolean;
  /** Search input change handler */
  inputOnChangeHandler?: React.ChangeEventHandler<HTMLInputElement>;
  /** Custom callback invoked when the search UI is deactivated */
  onSearchExit?: () => void;
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
 * Context provider for components rendered within the `ChannelSearch`
 */
export const SearchContextProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>({
  children,
  value,
}: PropsWithChildren<{
  value: SearchContextValue<StreamChatGenerics, Sources>;
}>) => (
  <SearchContext.Provider value={(value as unknown) as SearchContextValue}>
    {children}
  </SearchContext.Provider>
);

export const useSearchContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>() => {
  const contextValue = useContext(SearchContext);

  if (!contextValue) {
    console.warn(
      `The useChannelSearchContext hook was called outside of the ChannelSearchContext provider. Make sure this hook is called within the ChannelSearch component.`,
    );

    return {} as SearchContextValue<StreamChatGenerics, Sources>;
  }

  return (contextValue as unknown) as SearchContextValue<StreamChatGenerics, Sources>;
};
