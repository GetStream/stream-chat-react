import type { ComponentType } from 'react';
import React, { useEffect } from 'react';
import type { Channel, ChannelPaginator, ChannelPaginatorState } from 'stream-chat';

import { ChannelListItem } from '../ChannelListItem';
import { EmptyStateIndicator } from '../EmptyStateIndicator';
import { InfiniteScrollWithComponents } from '../InfiniteScrollPaginator/InfiniteScrollWithComponents';
import { LoadingChannels, LoadingIndicator } from '../Loading';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useStateStore } from '../../store';

export type ChannelListProps = {
  /** The `ChannelPaginator` that supplies this list's channels (its data source). */
  paginator: ChannelPaginator;
  loadMoreDebounceMs?: number;
  loadMoreThresholdPx?: number;
};

const channelPaginatorStateSelector = (state: ChannelPaginatorState) => ({
  lastQueryError: state.lastQueryError,
});

/**
 * Channel list driven by a single `ChannelPaginator`. The paginator is created +
 * coordinated by the `ChannelPaginatorsOrchestrator` on `ChatContext`; this component
 * only renders its reactive `state` and drives pagination. Selection is not this
 * component's concern — the `ChannelListItem` default `ListItem` opens the channel via
 * ChatView navigation.
 */
export const ChannelList = ({
  loadMoreDebounceMs,
  loadMoreThresholdPx,
  paginator,
}: ChannelListProps) => {
  const { channelPaginatorsOrchestrator, client } = useChatContext('ChannelList');
  const { lastQueryError } = useStateStore(
    paginator.state,
    channelPaginatorStateSelector,
  );
  const {
    EmptyListIndicator = DefaultEmptyChannelList,
    EndReachedIndicator = DefaultEndReachedIndicator,
    FirstPageLoadingIndicator = LoadingChannels,
    ListItem = DefaultListItem,
    LoadingNextPageIndicator = DefaultLoadingNextPageIndicator,
  } = useComponentContext();

  // Ref-counted: safe whether called here, from <ChannelLists/>, or from <Chat>.
  useEffect(
    () => channelPaginatorsOrchestrator.registerSubscriptions(),
    [channelPaginatorsOrchestrator],
  );

  useEffect(() => {
    if (paginator.items) return;
    paginator.nextDebounced();
  }, [paginator]);

  useEffect(() => {
    if (!lastQueryError) return;
    client.notifications.addError({
      message: lastQueryError.message,
      origin: { context: { reason: 'channel query error' }, emitter: 'ChannelList' },
    });
  }, [client, lastQueryError]);

  return (
    <InfiniteScrollWithComponents<Channel>
      EmptyListIndicator={EmptyListIndicator}
      EndReachedIndicator={EndReachedIndicator}
      FirstPageLoadingIndicator={FirstPageLoadingIndicator}
      ListItem={ListItem as ComponentType<{ item: Channel }>}
      LoadingNextPageIndicator={LoadingNextPageIndicator}
      loadNextDebounceMs={loadMoreDebounceMs}
      loadNextOnScrollToBottom={paginator.next}
      paginator={paginator}
      threshold={loadMoreThresholdPx}
    />
  );
};

const DefaultEmptyChannelList = () => <EmptyStateIndicator listType='channel' />;

const DefaultEndReachedIndicator = () => null;

const DefaultListItem = ({ item }: { item: unknown }) => (
  <ChannelListItem channel={item as Channel} />
);

const DefaultLoadingNextPageIndicator = ({ isLoading }: { isLoading?: boolean }) =>
  isLoading ? <LoadingIndicator /> : null;
