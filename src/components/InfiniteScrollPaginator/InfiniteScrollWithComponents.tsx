import type { ComponentType } from 'react';
import React, { forwardRef } from 'react';
import type { StateStore } from '@stream-io/state-store';
import type { PaginatorState } from 'stream-chat';

import { useStateStore } from '../../store';
import type { ListEndReachedUIProps, ListLoadingNextPageUIProps } from '../ListStates';
import type { InfiniteScrollPaginatorProps } from './InfiniteScrollPaginator';
import { InfiniteScrollPaginator } from './InfiniteScrollPaginator';

/** Structural view of a paginator, to avoid coupling to `BasePaginator`'s generic variance. */
type PaginatorLike<TItem> = {
  hasMoreHead: boolean;
  hasMoreTail: boolean;
  state: StateStore<PaginatorState<TItem>>;
  /**
   * The item's identity in the paginator, used as the React key. Needed where `id` is not unique: a
   * channel's `id` is unique only within its type, so a channel paginator keys by `cid`.
   */
  getItemId?: (item: TItem) => string;
};

export type InfiniteScrollWithComponentsProps<TItem extends { id?: string }> =
  InfiniteScrollPaginatorProps & {
    ListEmptyUI: React.ComponentType;
    ListEndReachedUI: React.ComponentType<ListEndReachedUIProps>;
    ListFirstPageLoadingUI: React.ComponentType;
    ListItem: ComponentType<{ item: TItem }>;
    ListLoadingNextPageUI: React.ComponentType<ListLoadingNextPageUIProps>;
    paginator: PaginatorLike<TItem>;
    hasReachedBottom?: (paginator: PaginatorLike<TItem>) => boolean;
    hasReachedTop?: (paginator: PaginatorLike<TItem>) => boolean;
  };

type InfiniteScrollWithComponentsComponent = <TItem extends { id?: string }>(
  props: InfiniteScrollWithComponentsProps<TItem>,
) => React.ReactNode;

/**
 * A loaded page holds no items. `undefined` items mean no page has loaded yet. A running reload
 * keeps the empty page until it replaces it, so the list stays empty meanwhile.
 */
const isLoadedEmpty = (items: readonly unknown[] | undefined) => items?.length === 0;

const paginatorStateSelector = <TItem,>(state: PaginatorState<TItem>) => ({
  isLoading: state.isLoading,
  items: state.items,
});

/**
 * Renders a paginator-backed list with pluggable list-state and item components, driven by the
 * paginator's `state`. Until a page loads it shows the first-page loading state; a failed first
 * page is the caller's to render, with its retry. A loaded page without items shows the empty
 * state, also while the list reloads. Next pages load at the bottom. The ref points to the scroll
 * root element.
 */
export const InfiniteScrollWithComponents = forwardRef(
  function InfiniteScrollWithComponents<TItem extends { id?: string }>(
    props: InfiniteScrollWithComponentsProps<TItem>,
    ref: React.ForwardedRef<unknown>,
  ) {
    const {
      hasReachedBottom,
      hasReachedTop,
      ListEmptyUI,
      ListEndReachedUI,
      ListFirstPageLoadingUI,
      ListItem,
      ListLoadingNextPageUI,
      paginator,
      ...componentProps
    } = props;

    const { isLoading, items } = useStateStore(
      paginator.state,
      paginatorStateSelector<TItem>,
    );
    const topEndReached = hasReachedTop?.(paginator) ?? !paginator.hasMoreHead;
    const bottomEndReached = hasReachedBottom?.(paginator) ?? !paginator.hasMoreTail;

    if (items === undefined) return <ListFirstPageLoadingUI />;
    if (isLoadedEmpty(items)) return <ListEmptyUI />;

    return (
      <>
        <ListEndReachedUI hasEnded={topEndReached} reached='top' />
        <InfiniteScrollPaginator {...componentProps} ref={ref}>
          {items.map((item) => (
            <ListItem item={item} key={paginator.getItemId?.(item) ?? item.id} />
          ))}
          <ListLoadingNextPageUI isLoading={isLoading} position='bottom' />
        </InfiniteScrollPaginator>
        <ListEndReachedUI hasEnded={bottomEndReached} reached='bottom' />
      </>
    );
  },
) as InfiniteScrollWithComponentsComponent;
