import clsx from 'clsx';
import type { ComponentProps, ComponentType, ReactNode } from 'react';
import React, { forwardRef, useCallback, useMemo } from 'react';
import type { ComputeItemKey, VirtuosoProps } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';

// Wraps the virtualized item list so views can attach padding/spacing to a
// stable class instead of reaching into Virtuoso's internal markup.
const VirtualizedListContent = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function VirtualizedListContent({ className, ...props }, ref) {
    return (
      <div
        {...props}
        className={clsx('str-chat__virtualized-list__content', className)}
        ref={ref}
      />
    );
  },
);

export type VirtualizedListProps<T> = {
  /** Items to render. An empty array renders the `EmptyPlaceholder`. */
  data: T[];
  /** Renders a single item; do not add a React key, Virtuoso manages keys. */
  itemContent: (index: number, item: T) => ReactNode;
  'aria-label'?: string;
  className?: string;
  computeItemKey?: ComputeItemKey<T, unknown>;
  /** Rendered in place of the list when `data` is empty. */
  EmptyPlaceholder?: ComponentType;
  /** Rendered below the items, e.g. a loading indicator for the next page. */
  Footer?: ComponentType;
  /** Called when the list is scrolled to the bottom to load the next page. */
  loadNext?: () => void;
  role?: string;
  /** Escape hatch for passing additional props straight to Virtuoso. */
  virtuosoProps?: VirtuosoProps<T, unknown>;
};

/**
 * Thin wrapper around `react-virtuoso`'s `Virtuoso` for the simple,
 * append-only, flat lists used across the ChannelDetail views. It keeps the
 * call sites declarative (data + itemContent + empty/footer slots) and hides
 * the infinite-scroll wiring.
 */
export const VirtualizedList = <T,>({
  className,
  computeItemKey,
  data,
  EmptyPlaceholder,
  Footer,
  itemContent,
  loadNext,
  virtuosoProps,
  ...rest
}: VirtualizedListProps<T>) => {
  const atBottomStateChange = useCallback(
    (atBottom: boolean) => {
      if (atBottom) loadNext?.();
    },
    [loadNext],
  );

  const components = useMemo(
    () => ({
      EmptyPlaceholder,
      Footer,
      List: VirtualizedListContent,
    }),
    [EmptyPlaceholder, Footer],
  );

  return (
    <Virtuoso
      atBottomStateChange={atBottomStateChange}
      className={clsx('str-chat__virtualized-list', className)}
      components={components}
      computeItemKey={computeItemKey}
      data={data}
      itemContent={itemContent}
      {...rest}
      {...virtuosoProps}
    />
  );
};
