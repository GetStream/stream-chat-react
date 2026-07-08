import type { ComponentType } from 'react';
import React from 'react';
import type { PaginatorState, StateStore } from 'stream-chat';

import { useStateStore } from '../../store';
import type { InfiniteScrollPaginatorProps } from './InfiniteScrollPaginator';
import { InfiniteScrollPaginator } from './InfiniteScrollPaginator';

/** Minimal structural view of a paginator this component reads — avoids coupling
 * to `BasePaginator`'s generic variance (items only need an optional `id` for keys). */
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

/**
 * Renders any paginator-backed list with pluggable indicator/item components,
 * driven by the paginator's reactive `state`. Used by the orchestrator-driven
 * channel list.
 */
export const InfiniteScrollWithComponents = <TItem extends { id?: string }>(
  props: InfiniteScrollWithComponentsProps<TItem>,
) => {
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
      <InfiniteScrollPaginator {...componentProps}>
        {items.map((item) => (
          <ListItem item={item} key={item.id} />
        ))}
        <LoadingNextPageIndicator isLoading={isLoading} />
      </InfiniteScrollPaginator>
      <EndReachedIndicator hasEnded={bottomEndReached} reached='bottom' />
    </>
  );
};
