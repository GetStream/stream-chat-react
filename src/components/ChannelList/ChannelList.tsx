import type { ComponentType } from 'react';
import React, { useEffect, useRef } from 'react';
import type { Channel, ChannelPaginator, ChannelPaginatorState } from 'stream-chat';

import { ChannelListItem } from '../ChannelListItem';
import { EmptyStateIndicator } from '../EmptyStateIndicator';
import { InfiniteScrollWithComponents } from '../InfiniteScrollPaginator/InfiniteScrollWithComponents';
import { LoadingChannels, LoadingIndicator } from '../Loading';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useChannelListKeyboardNavigation } from './hooks/useChannelListKeyboardNavigation';
import { useStateStore } from '../../store';

export type ChannelListProps = {
  /** The `ChannelPaginator` that supplies this list's channels (its data source). */
  paginator: ChannelPaginator;
  loadMoreDebounceMs?: number;
  loadMoreThresholdPx?: number;
};

const channelPaginatorStateSelector = (state: ChannelPaginatorState) => ({
  // `items === undefined` means "never queried" — the state a paginator starts in and returns to
  // when its data is discarded (e.g. `client.disconnectUser` resets every registered list). An
  // empty array is a loaded empty page and must not trigger a query.
  isUnloaded: state.items === undefined,
  lastQueryError: state.lastQueryError,
});

/**
 * Channel list driven by a single `ChannelPaginator`. The paginator is created +
 * coordinated by the `ChannelManager` on `ChatContext`; this component
 * only renders its reactive `state` and drives pagination. Selection is not this
 * component's concern — the `ChannelListItem` default `ListItem` opens the channel via
 * ChatView navigation.
 */
export const ChannelList = ({
  loadMoreDebounceMs,
  loadMoreThresholdPx,
  paginator,
}: ChannelListProps) => {
  const { channelManager, client } = useChatContext();
  const { t } = useTranslationContext();
  const { isUnloaded, lastQueryError } = useStateStore(
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

  // Keyboard roving + row-action navigation for this list. The scroll container (the
  // `InfiniteScrollPaginator` root, reached via `listboxRef`) IS the `role="listbox"` that owns this
  // list's `role="option"` rows — so no extra wrapper element is needed. The hook reads/focuses the
  // option rows under `listboxRef`.
  // NOTE: the hook's "focus the first item of the next page after Load more" branch is a no-op here —
  // the list paginates on scroll-to-bottom (no rendered `load-more-button` for its `LOAD_MORE_SELECTOR`
  // to match). Accepted; keyboard roving is unaffected.
  const listboxRef = useRef<HTMLDivElement>(null);
  const { onClickCapture, onKeyDown } = useChannelListKeyboardNavigation(listboxRef);

  // Ref-counted: safe whether called here, from <ChannelLists/>, or from <Chat>.
  useEffect(() => channelManager.registerSubscriptions(), [channelManager]);

  // Loads the first page, and reloads it whenever the list is emptied back to "never queried" —
  // the paginator outlives this component (it is registered on `client.channelManager`), so
  // querying only on mount would leave a list reset after a disconnect/reconnect permanently empty.
  useEffect(() => {
    if (!isUnloaded) return;
    paginator.toTailDebounced();
  }, [isUnloaded, paginator]);

  useEffect(() => {
    if (!lastQueryError) return;
    client.notifications.addError({
      message: lastQueryError.message,
      origin: { context: { reason: 'channel query error' }, emitter: 'ChannelList' },
    });
  }, [client, lastQueryError]);

  return (
    <InfiniteScrollWithComponents<Channel>
      aria-label={t('aria/Channel list')}
      contentProps={{ role: 'presentation' }}
      EmptyListIndicator={EmptyListIndicator}
      EndReachedIndicator={EndReachedIndicator}
      FirstPageLoadingIndicator={FirstPageLoadingIndicator}
      ListItem={ListItem as ComponentType<{ item: Channel }>}
      LoadingNextPageIndicator={LoadingNextPageIndicator}
      loadNextDebounceMs={loadMoreDebounceMs}
      loadNextOnScrollToBottom={paginator.next}
      onClickCapture={onClickCapture}
      onKeyDown={onKeyDown}
      paginator={paginator}
      ref={listboxRef}
      role='listbox'
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
