import type { ComponentProps, ComponentType } from 'react';
import React, { useEffect, useRef } from 'react';
import type { Channel, ChannelPaginator, ChannelPaginatorState } from 'stream-chat';

import { ChannelListItem } from '../ChannelListItem';
import { EmptyStateIndicator } from '../EmptyStateIndicator';
import { InfiniteScrollWithComponents } from '../InfiniteScrollPaginator/InfiniteScrollWithComponents';
import {
  ListLoadErrorIndicator as BaseListLoadErrorIndicator,
  type ListLoadErrorIndicatorProps,
  LoadingChannels,
  LoadingIndicator,
} from '../Loading';
import { getFirstPageLoadError } from '../Loading/getFirstPageLoadError';
import { useFirstPageLoadRetry } from '../Loading/hooks/useFirstPageLoadRetry';
import { useAddNotificationOnError } from '../Notifications/hooks/useAddNotificationOnError';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { ThemeScope } from '../../context/ThemeScopeContext';
import { useChannelListKeyboardNavigation } from './hooks/useChannelListKeyboardNavigation';
import { useStateStore } from '../../store';

/**
 * Attributes set on the list's `role="listbox"` element, the scroll container that holds the
 * channel rows. Only its accessible name can be set; role, ref and key handling stay the list's.
 */
export type ChannelListListboxProps = Pick<
  ComponentProps<'div'>,
  'aria-label' | 'aria-labelledby'
>;

export type ChannelListProps = {
  /** Paginator that supplies the channels of this list. */
  paginator: ChannelPaginator;
  /**
   * Names the listbox in place of the default "Channel list". Name each list when a page shows
   * several of them, e.g. pinned, inbox and archived channels: `{ 'aria-label': 'Archived' }`, or
   * `{ 'aria-labelledby': headingId }` to use a visible heading. `aria-labelledby` wins over
   * `aria-label` when both are set.
   */
  listboxProps?: ChannelListListboxProps;
  /**
   * The minimum interval, in milliseconds, between two checks of the scroll position for loading
   * the next page (`InfiniteScrollPaginator`'s `loadNextDebounceMs`).
   */
  loadMoreDebounceMs?: number;
  loadMoreThresholdPx?: number;
};

const channelPaginatorStateSelector = (state: ChannelPaginatorState) => ({
  // `items === undefined` means "never queried": the initial state, and where a paginator returns
  // when its data is discarded (e.g. `client.disconnectUser` resets every registered list). An
  // empty array is a loaded empty page and must not trigger a query. A failed first page leaves
  // `items` undefined too, but holds the error until a retry or a reset; with `throwErrors` set,
  // that error is all that keeps the list from querying again and again.
  awaitsFirstPage: state.items === undefined && !state.isLoading && !state.lastQueryError,
  firstPageLoadError: getFirstPageLoadError(state),
  lastQueryError: state.lastQueryError,
});

/**
 * Channel list driven by a single `ChannelPaginator`: it renders the paginator's state and drives
 * pagination. Selecting a channel is up to the `ListItem`; the default `ChannelListItem` opens it
 * through workspace navigation.
 */
export const ChannelList = ({
  listboxProps,
  loadMoreDebounceMs,
  loadMoreThresholdPx,
  paginator,
}: ChannelListProps) => {
  const { channelManager } = useChatContext();
  const { t } = useTranslationContext();
  const { awaitsFirstPage, firstPageLoadError, lastQueryError } = useStateStore(
    paginator.state,
    channelPaginatorStateSelector,
  );
  const {
    EmptyListIndicator = DefaultEmptyChannelList,
    EndReachedIndicator = DefaultEndReachedIndicator,
    FirstPageLoadingIndicator = LoadingChannels,
    ListItem = DefaultListItem,
    ListLoadErrorIndicator = DefaultListLoadErrorIndicator,
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
  // An initialized paginator has queried already; its pages arrive through that query or its
  // recovery, and a query from here would load the next page.
  useEffect(() => {
    if (!awaitsFirstPage || paginator.isInitialized) return;
    paginator.toTailDebounced();
  }, [awaitsFirstPage, paginator]);

  useAddNotificationOnError(lastQueryError, {
    emitter: 'ChannelList',
    message: t('channelList.loadError.text', "Couldn't load conversations"),
    targetPanels: ['channel-list'],
    type: 'api:channel:query:failed',
  });

  const firstPageLoadRetry = useFirstPageLoadRetry({
    firstPageLoadError,
    loadedMessage: t('channelList.loaded.text', 'Conversations loaded'),
    paginator,
    reload: paginator.reload,
  });

  if (firstPageLoadRetry.error) {
    return (
      <ThemeScope>
        <ListLoadErrorIndicator
          error={firstPageLoadRetry.error}
          isRetrying={firstPageLoadRetry.isRetrying}
          retry={firstPageLoadRetry.retry}
        />
      </ThemeScope>
    );
  }

  // Rendered without `ChannelNavigation` or `ChatView` above it, the list brings the theme scope.
  return (
    <ThemeScope>
      <InfiniteScrollWithComponents<Channel>
        aria-label={
          listboxProps?.['aria-label'] ??
          (listboxProps?.['aria-labelledby']
            ? undefined
            : t('channelList.channelList.ariaLabel', 'Channel list'))
        }
        aria-labelledby={listboxProps?.['aria-labelledby']}
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

const DefaultListLoadErrorIndicator = (props: ListLoadErrorIndicatorProps) => (
  <BaseListLoadErrorIndicator {...props} listType='channel' />
);

const DefaultEmptyChannelList = () => <EmptyStateIndicator listType='channel' />;

const DefaultEndReachedIndicator = () => null;

const DefaultListItem = ({ item }: { item: unknown }) => (
  <ChannelListItem channel={item as Channel} />
);

const DefaultLoadingNextPageIndicator = ({ isLoading }: { isLoading?: boolean }) =>
  isLoading ? <LoadingIndicator /> : null;
