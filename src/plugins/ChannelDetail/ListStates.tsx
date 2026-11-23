import React from 'react';
import type { SearchSource, SearchSourceState } from 'stream-chat';

import {
  ListLoadErrorUI as DefaultListLoadErrorUI,
  ListLoadingNextPageUI as DefaultListLoadingNextPageUI,
  type ListLoadErrorUIProps,
} from '../../components/ListStates';
import { useComponentContext } from '../../context';
import { useStateStore } from '../../store';

// The list states shared by the channel detail views: the error with a retry in place of a list
// whose first page failed, and the indicator below a list while a further page loads. Each view
// keeps its own empty state in its folder's `ListStates`.

/**
 * Shown in place of a channel detail view's list whose first page failed: `ListLoadErrorUI`.
 */
export const ChannelDetailListLoadErrorUI = (props: ListLoadErrorUIProps) => {
  const { ListLoadErrorUI = DefaultListLoadErrorUI } = useComponentContext();
  return <ListLoadErrorUI {...props} />;
};

const searchSourceFooterStateSelector = (state: SearchSourceState) => ({
  hasNextPage: state.hasNext,
  isLoading: state.isLoading,
});

export type ChannelDetailListLoadingNextPageUIProps<T> = {
  searchSource: SearchSource<T>;
};

/**
 * The bottom edge of a channel detail list: `ListLoadingNextPageUI`, with `isLoading` while
 * the search source loads a further page, centered while it does.
 */
export const ChannelDetailListLoadingNextPageUI = <T,>({
  searchSource,
}: ChannelDetailListLoadingNextPageUIProps<T>) => {
  const { ListLoadingNextPageUI = DefaultListLoadingNextPageUI } = useComponentContext();
  const { hasNextPage, isLoading } = useStateStore(
    searchSource.state,
    searchSourceFooterStateSelector,
  );
  const isLoadingNextPage = !!hasNextPage && !!isLoading;

  const indicator = (
    <ListLoadingNextPageUI isLoading={isLoadingNextPage} position='bottom' />
  );

  if (!isLoadingNextPage) return indicator;

  return <div className='str-chat__loading-indicator-placeholder'>{indicator}</div>;
};
