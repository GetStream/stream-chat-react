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
import { ThemeScope } from '../../context/ThemeScopeContext';
import { useChannelListKeyboardNavigation } from './hooks/useChannelListKeyboardNavigation';
import { useStateStore } from '../../store';

export type ChannelListProps = {
  /** Paginator that supplies the channels of this list. */
  paginator: ChannelPaginator;
  loadMoreDebounceMs?: number;
  loadMoreThresholdPx?: number;
};

const channelPaginatorStateSelector = (state: ChannelPaginatorState) => ({
  // `items === undefined` means "never queried": the initial state, and where a paginator returns
  // when its data is discarded (e.g. `client.disconnectUser` resets every registered list). An
  // empty array is a loaded empty page and must not trigger a query.
  isUnloaded: state.items === undefined,
  lastQueryError: state.lastQueryError,
});

/**
 * Channel list driven by a single `ChannelPaginator`: it renders the paginator's state and drives
 * pagination. Selecting a channel is up to the `ListItem`; the default `ChannelListItem` opens it
 * through workspace navigation.
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

  // The scroll container (the `InfiniteScrollPaginator` root, reached via `listboxRef`) is the
  // `role="listbox"` that owns the `role="option"` rows, so the hook needs no extra wrapper.
  // The hook's focus-after-Load-more branch is inert here: the list paginates on scroll to the
  // bottom and renders no `load-more-button`.
  const listboxRef = useRef<HTMLDivElement>(null);
  const { onClickCapture, onKeyDown } = useChannelListKeyboardNavigation(listboxRef);

  // Ref-counted, so `Chat` and other lists can register the same subscriptions.
  useEffect(() => channelManager.registerSubscriptions(), [channelManager]);

  // Loads the first page, and again whenever the list returns to "never queried": the paginator
  // outlives this component, so querying only on mount would leave a reset list permanently empty.
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

  // Rendered without `ChannelNavigation` or `ChatView` above it, the list brings the theme scope.
  return (
    <ThemeScope>
      <InfiniteScrollWithComponents<Channel>
        aria-label={t('channelList.channelList.ariaLabel', 'Channel list')}
        contentProps={{ role: 'presentation' }}
        EmptyListIndicator={EmptyListIndicator}
        EndReachedIndicator={EndReachedIndicator}
        FirstPageLoadingIndicator={FirstPageLoadingIndicator}
        ListItem={ListItem as ComponentType<{ item: Channel }>}
        LoadingNextPageIndicator={LoadingNextPageIndicator}
        loadNextDebounceMs={loadMoreDebounceMs}
        loadNextOnScrollToBottom={paginator.toTail}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
        paginator={paginator}
        ref={listboxRef}
        role='listbox'
        threshold={loadMoreThresholdPx}
      />
    </ThemeScope>
  );
};

const DefaultEmptyChannelList = () => <EmptyStateIndicator listType='channel' />;

const DefaultEndReachedIndicator = () => null;

const DefaultListItem = ({ item }: { item: unknown }) => (
  <ChannelListItem channel={item as Channel} />
);

const DefaultLoadingNextPageIndicator = ({ isLoading }: { isLoading?: boolean }) =>
  isLoading ? <LoadingIndicator /> : null;
