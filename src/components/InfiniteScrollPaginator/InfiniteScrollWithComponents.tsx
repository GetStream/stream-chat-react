import type { ComponentType } from 'react';
import React, { forwardRef } from 'react';
import type { StateStore } from '@stream-io/state-store';
import type { PaginatorState } from 'stream-chat';

import { useStateStore } from '../../store';
import type { InfiniteScrollPaginatorProps } from './InfiniteScrollPaginator';
import { InfiniteScrollPaginator } from './InfiniteScrollPaginator';

/** Structural view of a paginator, to avoid coupling to `BasePaginator`'s generic variance. */
type PaginatorLike<TItem> = {
  hasNext: boolean;
  hasPrev: boolean;
  state: StateStore<PaginatorState<TItem>>;
};

export type InfiniteScrollWithComponentsProps<TItem extends { id?: string }> =
  InfiniteScrollPaginatorProps & {
    EmptyListIndicator: React.ComponentType;
    EndReachedIndicator: React.ComponentType<{
      hasEnded: boolean;
      reached: 'top' | 'bottom';
    }>;
    FirstPageLoadingIndicator: React.ComponentType;
    ListItem: ComponentType<{ item: TItem }>;
    LoadingNextPageIndicator: React.ComponentType<{ isLoading?: boolean }>;
    paginator: PaginatorLike<TItem>;
    hasReachedBottom?: (paginator: PaginatorLike<TItem>) => boolean;
    hasReachedTop?: (paginator: PaginatorLike<TItem>) => boolean;
  };

type InfiniteScrollWithComponentsComponent = <TItem extends { id?: string }>(
  props: InfiniteScrollWithComponentsProps<TItem>,
) => React.ReactNode;

/**
 * Renders a paginator-backed list with pluggable indicator and item components, driven by the
 * paginator's `state`. The ref points to the scroll root element.
 */
export const InfiniteScrollWithComponents = forwardRef(
  function InfiniteScrollWithComponents<TItem extends { id?: string }>(
    props: InfiniteScrollWithComponentsProps<TItem>,
    ref: React.ForwardedRef<unknown>,
  ) {
    const {
      EmptyListIndicator,
      EndReachedIndicator,
      FirstPageLoadingIndicator,
      hasReachedBottom,
      hasReachedTop,
      ListItem,
      LoadingNextPageIndicator,
      paginator,
      ...componentProps
    } = props;

    const { isLoading, items } = useStateStore(paginator.state, (state) => ({
      isLoading: state.isLoading,
      items: state.items,
    }));
    const isLoadingFirstPage = items === undefined;
    const isEmpty = items?.length === 0;
    const topEndReached = hasReachedTop?.(paginator) ?? !paginator.hasPrev;
    const bottomEndReached = hasReachedBottom?.(paginator) ?? !paginator.hasNext;

    if (isLoadingFirstPage) return <FirstPageLoadingIndicator />;
    if (isEmpty) return <EmptyListIndicator />;

    return (
      <>
        <EndReachedIndicator hasEnded={topEndReached} reached='top' />
        <InfiniteScrollPaginator {...componentProps} ref={ref}>
          {items.map((item) => (
            <ListItem item={item} key={item.id} />
          ))}
          <LoadingNextPageIndicator isLoading={isLoading} />
        </InfiniteScrollPaginator>
        <EndReachedIndicator hasEnded={bottomEndReached} reached='bottom' />
      </>
    );
  },
) as InfiniteScrollWithComponentsComponent;
